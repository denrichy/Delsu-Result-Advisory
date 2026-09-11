import asyncio
from app.utils.supabase import supabase

res = supabase.table("notifications").select("*").limit(1).execute()
print("Notifications schema:", res.data[0].keys() if res.data else "No data")
