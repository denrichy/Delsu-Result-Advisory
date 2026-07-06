import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))

from app.performance import get_full_academic_record

matric_number = "FOS/22/23/286990"
record = get_full_academic_record(matric_number)

student_info = record.get('student_info', {})
baseline_units = student_info.get('baseline_units', 0)
baseline_gps = student_info.get('baseline_gps', 0.0)

if baseline_units > 0:
    pdf_cgpa = round(baseline_gps / baseline_units, 2)
else:
    pdf_cgpa = 0.0

current_cgpa = student_info.get('cgpa')

print(f"--- Student {matric_number} ---")
print(f"PDF Baseline Units: {baseline_units}")
print(f"PDF Baseline GPS: {baseline_gps}")
print(f"PDF Original CGPA (Baseline): {pdf_cgpa}")
print(f"Current System CGPA (Frontend): {current_cgpa}")
