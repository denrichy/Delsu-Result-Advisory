import sys
import os
import re

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env')))

from app.agent import run_agent

matric = "FOS/22/23/100006" # Has test data

messages = [
    "good morning!",
    "how's your day going?",
    "what if I scored A in all my courses?",
    "what if I scored F in all my courses?",
    "what was my CA and exam breakdown for MTH213?",
    "what's my attendance record?",
    "what's my rank compared to my classmates?",
    "am I on track to graduate with a First Class?",
    "what did I score in CSC999?",
    "what if I scored 150 in CSC401?",
    "what if I scored -10 in CSC401?",
    "what if I scored an A in a course I've never taken, like PHY999?",
    "what's the weather like today?",
    "sorry, back to my results — what was my GPA again?",
    "what if I had scored a B in MTH213 AND an A in CSC401, what would my GPA be?",
    "what's the minimum I'd need across all courses to reach a 4.5 GPA?",
    "do I have any failed courses?",
    "am I eligible to graduate this semester?",
    "thanks, this is helpful",
    "thank you, goodbye"
]

conversation_history = []
transcript = []

print(f"Starting test with matric number: {matric}")
print("="*60)

for i, msg in enumerate(messages, 1):
    print(f"\n============================================================")
    print(f"MESSAGE {i}/50")
    print(f"USER: {msg}")
    print(f"============================================================")
    
    try:
        response = run_agent(matric, msg, conversation_history)
        print(f"\nAGENT RESPONSE:\n{response}")
    except Exception as e:
        response = f"ERROR: {str(e)}"
        print(f"\nAGENT RESPONSE:\n{response}")
        
    transcript.append({"i": i, "user": msg, "agent": response})
    conversation_history.append({"role": "user", "content": msg})
    conversation_history.append({"role": "assistant", "content": response})

print("\n" + "="*60)
print("TEST COMPLETE.")
