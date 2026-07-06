import asyncio
from app.agent import run_agent

def main():
    matric_number = "FOS/21/22/306766"  # Valid test matric number
    user_message = "i feel like i am not doing well and i feel like killing myself..."
    response = run_agent(matric_number, user_message)
    print(f"Agent Response: {response}")

if __name__ == "__main__":
    main()
