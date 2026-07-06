import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))

from app.performance import get_student_results, supabase

print("Fetching 10 students with likely carryovers from the database...")

# Fetch 20 students to find those with F grades
student_res = supabase.table("students").select("*").limit(30).execute()
students = student_res.data

count = 0
for student in students:
    matric_number = student["matric_number"]
    results = get_student_results(matric_number)
    
    # Check if student has carryovers (any 'F' grade or any courses taken from a lower level)
    has_f = any(r.get("grade") == "F" for r in results)
    
    baseline_units = student.get("baseline_units") or 0
    baseline_gps = student.get("baseline_gps") or 0.0
    
    if baseline_units == 0: continue
    
    # Strict Math
    total_units_strict = baseline_units
    total_gps_strict = baseline_gps
    
    # Adjusted Math (Hypothesis: Failed courses are not added to cumulative TCP)
    total_units_adjusted = baseline_units
    total_gps_adjusted = baseline_gps
    
    for r in results:
        score = float(r.get("score") or 0)
        units = int(r.get("units") or 0)
        
        if score >= 70: gp = 5.0
        elif score >= 60: gp = 4.0
        elif score >= 50: gp = 3.0
        elif score >= 45: gp = 2.0
        else: gp = 0.0
        
        course_gps = gp * units
        
        # Strict logic: all units added
        total_units_strict += units
        total_gps_strict += course_gps
        
        # Adjusted logic: If they got an F, DELSU might omit it from the cumulative TCP?
        # OR if it's a course they are repeating (e.g. they got an F previously, and now they take it again)
        # Actually, let's just show what the CGPA would be if we omitted current Fs.
        total_gps_adjusted += course_gps
        if gp > 0: # If they didn't fail it THIS time
            total_units_adjusted += units
            
    if total_units_strict > 0:
        cgpa_strict = round(total_gps_strict / total_units_strict, 2)
    else:
        cgpa_strict = 0
        
    if total_units_adjusted > 0:
        cgpa_adjusted = round(total_gps_adjusted / total_units_adjusted, 2)
    else:
        cgpa_adjusted = 0
        
    print(f"\nMatric: {matric_number} | Has F: {has_f}")
    print(f"Strict Math CGPA: {cgpa_strict}   (Units: {total_units_strict})")
    
    # Also find how many units difference it takes to hit the adjusted
    count += 1
    if count >= 10:
        break
