import os
import sys
import pandas as pd

excel_path = r"C:\Users\HP\Desktop\FYP\just-testing\400_LEVEL_STUDENTS_COPY_1ST_SEMESTER_COMPUTER_SCIE_260701_222840.xlsx"

try:
    df = pd.read_excel(excel_path)
except Exception as e:
    print(f"Error loading Excel: {e}")
    sys.exit()

print("--- Data for FOS/21/22/276003 ---")
# Find the row where any column contains this matric number
student_row = None
for index, row in df.iterrows():
    for col in df.columns:
        if str(row[col]).strip() == "FOS/21/22/276003":
            student_row = row
            break
    if student_row is not None:
        break

if student_row is not None:
    print(student_row.dropna().to_dict())
else:
    print("Student not found in excel.")

print("\n--- Testing 10 Carryover Students ---")
# Let's find rows that look like student rows. Typically they have a CGPA column.
# Let's just print out a few rows to see the structure if we can't easily parse it.
print("\nHeaders:")
print(list(df.columns))
