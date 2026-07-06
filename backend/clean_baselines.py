import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))

def clean_phantom_baselines():
    print("Fetching all students...")
    students_res = supabase.table("students").select("id, matric_number, baseline_units").execute()
    students = students_res.data
    
    cleaned_count = 0
    for s in students:
        sid = s["id"]
        # Check if student has any results
        res_count = supabase.table("results").select("id", count="exact").eq("student_id", sid).limit(1).execute()
        count = res_count.count if res_count and hasattr(res_count, 'count') and res_count.count is not None else 0
        
        # If no results but they have baseline data, clear it
        if count == 0 and s.get("baseline_units") and int(s.get("baseline_units")) > 0:
            print(f"Cleaning phantom baseline for {s['matric_number']}")
            supabase.table("students").update({
                "baseline_units": 0,
                "baseline_gps": 0.0,
                "outstanding_courses": ""
            }).eq("id", sid).execute()
            cleaned_count += 1
            
    print(f"Done. Cleaned {cleaned_count} phantom students.")

if __name__ == "__main__":
    clean_phantom_baselines()
