import sys
import os

sys.path.append(os.path.abspath(r'C:\Users\HP\Desktop\FYP\Delsu-Result-Advisory\backend'))
from app.agent import run_agent

matric = 'FOS/22/23/100006'
history = []

tests = [
    "what if I retake MTH213 and get a B?"
]

for msg in tests:
    sep = "=" * 60
    print(f"\n{sep}")
    print(f"USER: {msg}")
    print(sep)
    res = run_agent(matric, msg, history)
    print(f"\n--- FINAL DISPLAYED MESSAGE ---")
    print(res)
    history.append({"role": "user", "content": msg})
    history.append({"role": "assistant", "content": res})
