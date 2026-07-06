import os
from app.db import supabase

# Get all students
res = supabase.table("students").select("id, matric_number, baseline_units").execute()
students = res.data or []

# Get all student_ids that have results
r_res = supabase.table("results").select("student_id").execute()
student_ids_with_results = set([r["student_id"] for r in (r_res.data or [])])

phantom_ids = []
for s in students:
    if s.get("baseline_units", 0) > 0 and s["id"] not in student_ids_with_results:
        print(f"Phantom student found: {s['matric_number']}")
        phantom_ids.append(s["id"])

print(f"Total phantoms found: {len(phantom_ids)}. Updating in batches...")

# Batch update
batch_size = 50
for i in range(0, len(phantom_ids), batch_size):
    batch = phantom_ids[i:i+batch_size]
    try:
        supabase.table("students").update({
            "baseline_units": 0,
            "baseline_gps": 0.0,
            "outstanding_courses": ""
        }).in_("id", batch).execute()
        print(f"Updated batch of {len(batch)} students.")
    except Exception as e:
        print(f"Failed to update batch: {e}")

print("Done.")
