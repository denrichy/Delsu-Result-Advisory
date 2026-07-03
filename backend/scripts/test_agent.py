import sys
import os

# Ensure the parent directory is in the path to import app correctly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.agent import run_agent

def main():
    matric = "FOS/22/23/100001"
    messages = [
        "what was my CA and exam breakdown for MTH213?"
    ]

    print(f"Testing agent for {matric}...\n")
    for msg in messages:
        print(f"User: {msg}")
        try:
            res = run_agent(matric, msg)
            print(f"Agent: {res}\n")
        except Exception as e:
            print(f"Error: {e}\n")

if __name__ == "__main__":
    main()
