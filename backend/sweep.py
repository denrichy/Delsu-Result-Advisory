from app.db import supabase

def sweep_phantoms():
    print("Sweeping phantom baselines...")
    res = supabase.table("students").select("id, baseline_units").execute()
    if not res.data: 
        print("No students found.")
        return
        
    phantom_ids = []
    for s in res.data:
        if s.get("baseline_units", 0) > 0:
            r_res = supabase.table("results").select("id").eq("student_id", s["id"]).limit(1).execute()
            if not r_res.data:
                phantom_ids.append(s["id"])
    
    if phantom_ids:
        print(f"Found {len(phantom_ids)} phantom students. Cleaning up...")
        batch_size = 50
        for i in range(0, len(phantom_ids), batch_size):
            batch = phantom_ids[i:i+batch_size]
            supabase.table("students").update({
                "baseline_units": 0,
                "baseline_gps": 0.0,
                "outstanding_courses": ""
            }).in_("id", batch).execute()
        print("Sweep complete!")
    else:
        print("No phantom baselines found! Clean as a whistle.")

def create_trigger():
    print("Creating Postgres trigger...")
    # We execute SQL by calling the Postgres REST API (rpc) if we had a function,
    # but we can't directly execute raw SQL via Supabase client without an RPC endpoint.
    # So we'll need to use raw asyncpg or psycopg2 to connect to the DB directly.
    pass

if __name__ == "__main__":
    sweep_phantoms()
