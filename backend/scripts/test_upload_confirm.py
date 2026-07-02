import httpx
import uuid
import sys
import os

# add backend to path to import app.db
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.db import supabase

adviser_id = "09583752-673c-409d-957b-948794f54632"

# 5 sample rows from wide broadsheet format
rows = [
    {
      "matric_number": "FOS/22/23/100001",
      "course_code": "CSC401",
      "units": 3,
      "course_type": "C",
      "score": 61,
      "grade": "B"
    },
    {
      "matric_number": "FOS/22/23/100001",
      "course_code": "CSC402",
      "units": 2,
      "course_type": "E",
      "score": 100,
      "grade": "A"
    },
    {
      "matric_number": "FOS/22/23/100002",
      "course_code": "CSC401",
      "units": 3,
      "course_type": "C",
      "score": 44,
      "grade": "F"
    },
    {
      "matric_number": "FOS/22/23/100002",
      "course_code": "CSC402",
      "units": 2,
      "course_type": "E",
      "score": 88,
      "grade": "A"
    },
    {
      "matric_number": "FOS/22/23/100003",
      "course_code": "MTH213",
      "units": 3,
      "course_type": "C",
      "score": 43,
      "grade": "F"
    }
]

payload = {
    "rows": rows,
    "semester": "First",
    "session": "2025/2026",
    "adviser_id": adviser_id,
    "filename": "wide_broadsheet_format.xlsx"
}

print(f"Sending payload for adviser {adviser_id}...")
try:
    resp = httpx.post("http://127.0.0.1:8000/upload-confirm", json=payload)
    print("API Response:", resp.json())
except Exception as e:
    print("Error:", e)

print("\n--- DB VERIFICATION ---")
c_res = supabase.table("courses").select("*").in_("course_code", ["CSC401", "CSC402", "MTH213"]).execute()
print(f"\nCourses in DB: {len(c_res.data)}")
for c in c_res.data:
    print(f" - {c['course_code']} (units: {c['units']}, type: {c['course_type']})")

s_res = supabase.table("students").select("*").in_("matric_number", ["FOS/22/23/100001", "FOS/22/23/100002", "FOS/22/23/100003"]).execute()
print(f"\nStudents in DB: {len(s_res.data)}")
for s in s_res.data:
    print(f" - {s['matric_number']}")
    
u_res = supabase.table("uploads").select("*").eq("adviser_id", adviser_id).execute()
print(f"\nUploads in DB: {len(u_res.data)}")
if u_res.data:
    print(f" - Filename: {u_res.data[0]['filename']}, Rows: {u_res.data[0]['raw_row_count']}")

r_res = supabase.table("results").select("*, students(matric_number), courses(course_code)").eq("uploaded_by", adviser_id).execute()
print(f"\nResults in DB: {len(r_res.data)}")
for r in r_res.data:
    print(f" - {r['students']['matric_number']} took {r['courses']['course_code']}: {r['score']}{r['grade']} ({r['semester']} {r['session']})")
