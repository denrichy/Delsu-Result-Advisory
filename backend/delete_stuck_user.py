import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

email = "ifeanyiwisdom67@gmail.com"

# In supabase python client, admin API is under supabase.auth.admin
users = supabase.auth.admin.list_users()

user_id = None
for u in users:
    if u.email == email:
        user_id = u.id
        break

if user_id:
    print(f"Deleting user {email} with id {user_id}")
    supabase.auth.admin.delete_user(user_id)
    print("Deleted successfully.")
else:
    print(f"User {email} not found.")
