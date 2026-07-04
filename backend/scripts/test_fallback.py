import sys
import os

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env')))

from app.agent import run_agent

matric = "FOS/22/23/100006"

messages = [
    "what is my semester GPA for the Second Semester of 2025/2026?",
    "what courses have I taken?"
]

print("Testing empty response fallback mechanism...")

for msg in messages:
    print("\n" + "="*60)
    print(f"USER: {msg}")
    print("="*60)
    try:
        response = run_agent(matric, msg, [])
        print(f"\nAGENT RESPONSE:\n{response}")
    except Exception as e:
        print(f"\nERROR: {e}")
