import os
from app.ingestion import detect_sheet_format, melt_wide_format
from app.performance import calculate_gpa

filepath = r"C:\Users\HP\Desktop\FYP\just-testing\400_LEVEL_STUDENTS_COPY_1ST_SEMESTER_COMPUTER_SCIE_260701_222840.xlsx"
detect_res = detect_sheet_format(filepath)
fmt = detect_res.get("format", "unknown")
course_cols = detect_res.get("detected_course_columns", [])
course_row_idx = detect_res.get("course_row_idx", 0)

long_data, metadata = melt_wide_format(filepath, course_cols, course_row_idx)

matric_to_check = "FOS/22/23/292985"

print(f"Checking {matric_to_check}...")
total_units = 0
for row in long_data:
    if row["matric_number"] == matric_to_check:
        print(f"Course: {row['course_code']}, Score: {row['score']}, Units: {row['units']}")
        total_units += row['units'] or 0

print(f"System calculated current total units: {total_units}")
