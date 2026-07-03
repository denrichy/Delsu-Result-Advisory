import os
import json
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv

# Load .env from the backend directory (parent of this file's directory)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

from app.performance import get_semester_gpa, get_cumulative_gpa, get_course_breakdown

def run_agent(matric_number: str, user_message: str, conversation_history=None):
    if conversation_history is None:
        conversation_history = []
        
    system_prompt = (
        "You are Compass, an academic advisory assistant for a DELSU Computer \n"
        "Science student. You're warm, direct, and conversational — not robotic. \n\n"
        "You have access to tools that retrieve the student's real academic data \n"
        "(GPA, course scores, breakdowns). Always use these tools to answer any \n"
        "question about their performance, grades, or academic standing — never \n"
        "guess or estimate numbers. Recognize varied ways students might ask the \n"
        "same thing (e.g. 'how am I doing', 'am I on track', 'should I be worried' \n"
        "all relate to their GPA/performance).\n\n"
        "You can have natural conversation — greetings, small talk, follow-up \n"
        "questions — but you stay in character as their academic advisor. If \n"
        "asked something entirely unrelated to academics (general trivia, other \n"
        "topics), politely redirect: acknowledge it briefly and warmly steer back \n"
        "to what you can help with, without being curt or robotic about it.\n\n"
        "Be concise. Don't over-explain or pad responses with unnecessary \n"
        "caveats."
    )
    
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_semester_gpa",
                "description": "Get the GPA for a specific semester and session.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "semester": {
                            "type": "string",
                            "description": "The semester (e.g. 'First Semester' or 'Second Semester')",
                        },
                        "session": {
                            "type": "string",
                            "description": "The academic session (e.g. '2025/2026')",
                        }
                    },
                    "required": ["semester", "session"],
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_cumulative_gpa",
                "description": "Get the overall cumulative GPA of the student.",
                "parameters": {
                    "type": "object",
                    "properties": {},
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_course_breakdown",
                "description": "Get the full list of all courses the student has taken, including scores and grades.",
                "parameters": {
                    "type": "object",
                    "properties": {},
                }
            }
        }
    ]
    
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})
    
    # 1. First call to model
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )
    
    response_message = response.choices[0].message
    
    # Check if the model decided to call a tool
    tool_calls = response_message.tool_calls
    
    if tool_calls:
        # Append the assistant's message (which contains the tool calls) to the messages
        messages.append(response_message)
        
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            # Execute the local function
            result = None
            if function_name == "get_semester_gpa":
                result = get_semester_gpa(
                    matric_number, 
                    function_args.get("semester"), 
                    function_args.get("session")
                )
            elif function_name == "get_cumulative_gpa":
                result = get_cumulative_gpa(matric_number)
            elif function_name == "get_course_breakdown":
                result = get_course_breakdown(matric_number)
            else:
                result = {"error": f"Unknown function {function_name}"}
                
            # Append the tool response
            messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": json.dumps(result)
            })
            
        # 2. Second call to model with tool results
        second_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages
        )
        return second_response.choices[0].message.content
        
    return response_message.content
