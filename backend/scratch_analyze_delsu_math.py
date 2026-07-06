import os
import sys
import pandas as pd

excel_path = r"C:\Users\HP\Desktop\FYP\just-testing\400_LEVEL_STUDENTS_COPY_1ST_SEMESTER_COMPUTER_SCIE_260701_222840.xlsx"

try:
    df = pd.read_excel(excel_path, skiprows=10) # Skip header rows, might need adjustment
except Exception as e:
    print(f"Error loading Excel: {e}")
    sys.exit()

# Let's write a robust parser
# Since I saw the columns earlier:
# Unnamed: 1 is Matric Number
# Summary of Previous Semesters is Prev TCP (Col 4, Unnamed: 4?)
# Unnamed: 5 is Prev Passed
# Unnamed: 6 is Prev TGP
# Summary of Current Semester is Current TCP
# Unnamed: 36 is Current TGP
# Summary of All Semesters is Cum TCP
# Unnamed: 42 is Cum TGP
# Unnamed: 43 is CGPA

df_cleaned = pd.read_excel(excel_path)

students = []
for index, row in df_cleaned.iterrows():
    matric = str(row.get('Unnamed: 1', '')).strip()
    if matric.startswith('FOS'):
        try:
            prev_tcp = float(row.get('Summary of Previous Semesters', 0))
            prev_tgp = float(row.get('Unnamed: 6', 0))
            
            curr_tcp = float(row.get('Summary of Current Semester', 0))
            curr_passed = float(row.get('Unnamed: 35', 0))
            curr_tgp = float(row.get('Unnamed: 36', 0))
            
            cum_tcp = float(row.get('Summary of All Semesters', 0))
            cum_tgp = float(row.get('Unnamed: 42', 0))
            official_cgpa = float(row.get('Unnamed: 43', 0))
            
            remarks = str(row.get('Remarks', ''))
            
            students.append({
                'matric': matric,
                'prev_tcp': prev_tcp,
                'prev_tgp': prev_tgp,
                'curr_tcp': curr_tcp,
                'curr_passed': curr_passed,
                'curr_tgp': curr_tgp,
                'cum_tcp': cum_tcp,
                'cum_tgp': cum_tgp,
                'official_cgpa': official_cgpa,
                'remarks': remarks
            })
        except ValueError:
            pass

print(f"Found {len(students)} students.")

carryover_students = [s for s in students if 'FOS' in s['matric'] and type(s['remarks']) == str and len(s['remarks']) > 3]

print(f"Found {len(carryover_students)} carryover students.")

for s in carryover_students[:15]:
    # Calculate Method 1: Standard (Includes Fs, cum_tcp = prev_tcp + curr_tcp)
    calc_cum_tcp_standard = s['prev_tcp'] + s['curr_tcp']
    calc_cgpa_standard = round(s['cum_tgp'] / calc_cum_tcp_standard, 2) if calc_cum_tcp_standard > 0 else 0
    
    # Calculate Method 2: Dropping Fs (cum_tcp = prev_tcp + curr_passed)
    calc_cum_tcp_dropped = s['prev_tcp'] + s['curr_passed']
    calc_cgpa_dropped = round(s['cum_tgp'] / calc_cum_tcp_dropped, 2) if calc_cum_tcp_dropped > 0 else 0
    
    # Check what the official Cum TCP says
    official_cum_tcp = s['cum_tcp']
    
    print(f"\nMatric: {s['matric']}")
    print(f"Remarks (Carryovers): {s['remarks']}")
    print(f"Prev TCP: {s['prev_tcp']} | Curr TCP: {s['curr_tcp']} | Curr Passed: {s['curr_passed']}")
    print(f"Official Cum TCP: {official_cum_tcp} | Official CGPA: {s['official_cgpa']}")
    
    if official_cum_tcp == calc_cum_tcp_standard and official_cum_tcp != calc_cum_tcp_dropped:
        print("=> DELSU Math: STANDARD (Includes Fs in TCP)")
    elif official_cum_tcp == calc_cum_tcp_dropped and official_cum_tcp != calc_cum_tcp_standard:
        print("=> DELSU Math: DROPPED Fs (Excluded Fs from TCP)")
    elif official_cum_tcp == calc_cum_tcp_standard and official_cum_tcp == calc_cum_tcp_dropped:
        print("=> DELSU Math: EQUAL (Student passed all current courses)")
    else:
        print(f"=> DELSU Math: UNKNOWN. Standard={calc_cum_tcp_standard}, Dropped={calc_cum_tcp_dropped}, Official={official_cum_tcp}")

