from app.agent import run_agent

history = [
    {"role": "user", "content": "how am i doing currently?"},
    {"role": "assistant", "content": "Your current cumulative GPA is 4.03."}
]

print(run_agent("FOS/22/23/292155", "okay", history))
