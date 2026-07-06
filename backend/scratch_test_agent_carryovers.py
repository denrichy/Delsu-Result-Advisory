import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))

from app.agent import run_agent

matric_number = "FOS/22/23/286990"
user_message = "How many carriovers do I have so far?"

print(f"Testing agent for {matric_number}...")
response = run_agent(matric_number, user_message)

print("\n--- AGENT RESPONSE ---")
print(response.get("response"))
