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

supabase: Client = create_client(url, key, options=options)

# Admin client using service role key (for bypassing RLS / deleting auth users)
supabase_admin: Client | None = None
if service_key:
    supabase_admin = create_client(url, service_key, options=options)
