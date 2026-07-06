import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))

from app.agent import run_agent

matric_number = "FOS/22/23/292155"

print("\n=== SIMULATE GPA TESTS ===")
messages = [
    "what if I scored 150 in MTH213?",
    "what if I scored -20 in MTH213?",
    "what if I scored A in a course I've never taken, like PHY999?"
]
for msg in messages:
    print(f"\n--- TESTING MESSAGE: '{msg}' ---")
    response = run_agent(matric_number, msg)
    print(f"\n--- FINAL AGENT OUTPUT ---\n{response}\n")
