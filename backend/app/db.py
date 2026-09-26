import os
import httpx
from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
service_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in the environment variables.")

# Explicitly disable HTTP/2 to prevent httpx ReadErrors during parallel requests
custom_http_client = httpx.Client(http2=False)
options = ClientOptions(httpx_client=custom_http_client)

# The backend is a trusted boundary. It uses the service-role client only after
# route dependencies have authenticated and authorized the caller. Browser code
# must continue to use the publishable/anon key and is protected by RLS.
if not service_key:
    raise ValueError("SUPABASE_SERVICE_ROLE_KEY must be set for the backend.")

supabase_admin: Client = create_client(url, service_key, options=options)
supabase: Client = supabase_admin
