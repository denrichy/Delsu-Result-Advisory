from dotenv import load_dotenv
import os

load_dotenv()
key = os.environ.get("GROQ_API_KEY", "")
print(f"Key found: {bool(key)}")
print(f"Key length: {len(key)}")
print(f"Starts with gsk_: {key.startswith('gsk_')}")
print(f"First 8 chars: {key[:8]}...")
