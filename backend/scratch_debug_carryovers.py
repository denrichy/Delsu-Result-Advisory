import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))

from app.performance import get_full_academic_record, supabase
from app.analytics import get_student_carryovers
import re

matric_number = "FOS/22/23/286990"

print(f"=== ANALYZING STUDENT {matric_number} ===")

# 1. DB Static Outstanding Courses
res = supabase.table("students").select("outstanding_courses").eq("matric_number", matric_number).execute()
if res.data:
    static_str = res.data[0].get("outstanding_courses") or ""
    print("\n--- 1. STATIC DB 'outstanding_courses' STRING ---")
    print(static_str)
    
    # How does performance.py parse it?
    prev_courses = re.findall(r'[A-Za-z]{3}\s*\d{3}', static_str)
    print("\n--- Parsed Static Courses ---")
    print(prev_courses)
else:
    print("Student not found in DB.")
    sys.exit()

# 2. Dynamic Carryovers
print("\n--- 2. DYNAMIC 'get_student_carryovers()' ---")
dynamic_carryovers = get_student_carryovers(matric_number)
print([c.get("course_code") for c in dynamic_carryovers])

# 3. Merged Record (What the frontend sees)
print("\n--- 3. FRONTEND MERGED 'get_full_academic_record()' ---")
record = get_full_academic_record(matric_number)
merged_outstanding = record.get("outstanding_courses", [])
print(f"Total merged count: {len(merged_outstanding)}")
print([c.get("course_code") for c in merged_outstanding])
