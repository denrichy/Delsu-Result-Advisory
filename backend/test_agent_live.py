import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))

from app.agent import run_agent

matric_number = "FOS/22/23/292155"
messages = [
    "can I still graduate with a First Class?"
]

print("=== STARTING TESTS ===")
for msg in messages:
    print(f"\n--- TESTING MESSAGE: '{msg}' ---")
    response = run_agent(matric_number, msg)
    print(f"\n--- FINAL AGENT OUTPUT ---\n{response}\n")
print("=== END TESTS ===")
