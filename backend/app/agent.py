import os
import json
import re
from pathlib import Path
from groq import Groq, BadRequestError
from dotenv import load_dotenv

# Load .env from the backend directory (parent of this file's directory)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

from app.performance import get_semester_gpa, get_cumulative_gpa, get_course_breakdown, simulate_gpa, simulate_gpa_uniform

# Maximum retries for Groq tool_use_failed errors
MAX_RETRIES = 2

def _call_groq(messages, tools, tool_choice="auto", temperature=0):
    """Wrapper around the Groq API call with retry logic for tool_use_failed errors."""
    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                tools=tools,
                tool_choice=tool_choice,
                temperature=temperature
            )
            return response
        except BadRequestError as e:
            error_body = getattr(e, 'body', None) or {}
            error_info = error_body.get('error', {}) if isinstance(error_body, dict) else {}
            code = error_info.get('code', '')
            print(f"[DIAGNOSTIC] Groq BadRequestError (attempt {attempt+1}/{MAX_RETRIES}): {e}")
            print(f"[DIAGNOSTIC] Error code: {code}, failed_generation: {error_info.get('failed_generation', 'N/A')}")
            if code == 'tool_use_failed' and attempt < MAX_RETRIES - 1:
                print(f"[DIAGNOSTIC] Retrying...")
                continue
            # Exhausted retries or different error — re-raise
            raise
    # Should not reach here, but just in case
    raise RuntimeError("Exhausted retries for Groq API call")

def _execute_tool(function_name, function_args, matric_number):
    """Dispatch a tool call to the correct local function."""
    if function_name == "get_semester_gpa":
        return get_semester_gpa(
            matric_number,
            function_args.get("semester"),
            function_args.get("session")
        )
    elif function_name == "get_cumulative_gpa":
        return get_cumulative_gpa(matric_number)
    elif function_name == "get_course_breakdown":
        return get_course_breakdown(matric_number)
    elif function_name == "simulate_gpa":
        return simulate_gpa(
            matric_number,
            function_args.get("course_code"),
            function_args.get("hypothetical_input")
        )
    elif function_name == "simulate_gpa_uniform":
        return simulate_gpa_uniform(
            matric_number,
            function_args.get("hypothetical_grade_letter")
        )
    else:
        return {"error": f"Unknown function {function_name}"}

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
        "You must NEVER invent, estimate, or fabricate any number, score, or breakdown \n"
        "that wasn't directly returned by a tool call. If a student asks for information \n"
        "your tools cannot provide (e.g. a CA/Exam breakdown, since only a combined \n"
        "final score and grade exist per course), explicitly tell them that specific \n"
        "detail isn't available in their records, rather than guessing or making up a \n"
        "plausible-sounding answer. It's always better to say 'I don't have that \n"
        "specific breakdown' than to invent numbers.\n\n"
        "The only valid GPA terms are 'semester GPA' and 'cumulative GPA' — never use "
        "'overall GPA' or any other term. If a student has only one semester of results, "
        "cumulative and semester GPA will be identical — state this clearly if asked, "
        "don't invent a different number for either.\n\n"
        "Never make any claim about degree requirements, graduation eligibility, "
        "class of degree, or 'being on track' unless a tool result directly supports it. "
        "No such tool currently exists — so do not make these claims at all right now.\n\n"
        "For hypothetical/what-if GPA questions about a single course, always use the "
        "simulate_gpa tool rather than calculating manually — never do this math yourself.\n"
        "When a student gives a letter grade (e.g. 'get a B') for a hypothetical, pass the LETTER "
        "directly to simulate_gpa — never convert it to a number yourself. The tool handles that "
        "conversion using the canonical scale.\n"
        "Before framing any answer as a 'retake' scenario, check the course's current grade "
        "returned by simulate_gpa. If it's not F, correct the student: the course was already "
        "passed, so it wouldn't normally be retaken. Example: if current_grade is 'C' and the student "
        "asks about a 'retake', say something like 'Note: MTH213 was already passed with a C, so it "
        "isn't eligible for retake — but here's what your GPA would look like hypothetically if that "
        "score had been different.'\n\n"
        "For 'what if I scored X in all my courses' questions, use simulate_gpa_uniform "
        "— never calculate this yourself.\n\n"
        "You must ONLY call tools from the tools list provided to you. Never invent or "
        "reference a tool name that isn't in that list.\n\n"
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
        },
        {
            "type": "function",
            "function": {
                "name": "simulate_gpa",
                "description": "Calculate what the student's cumulative GPA would be if they scored a specific hypothetical score in a specific course.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "course_code": {
                            "type": "string",
                            "description": "The course code to simulate, e.g. MTH213"
                        },
                        "hypothetical_input": {
                            "type": "string",
                            "description": "The hypothetical score (0-100) or letter grade (A/B/C/D/F) to test, e.g. '75' or 'A'"
                        }
                    },
                    "required": ["course_code", "hypothetical_input"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "simulate_gpa_uniform",
                "description": "Calculate cumulative GPA if EVERY course had a specific hypothetical letter grade.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "hypothetical_grade_letter": {
                            "type": "string",
                            "description": "The hypothetical grade letter (A, B, C, D, or F)"
                        }
                    },
                    "required": ["hypothetical_grade_letter"]
                }
            }
        }
    ]
    
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})

    # 1. First call to model — always tool_choice="auto", temperature=0
    try:
        response = _call_groq(messages, tools, tool_choice="auto", temperature=0)
    except BadRequestError:
        print("[DIAGNOSTIC] Groq API failed after retries on initial call.")
        return "I'm having trouble processing that — could you rephrase your question?"

    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls
    print(f"\n[DIAGNOSTIC] User message: {repr(user_message)}")
    print(f"[DIAGNOSTIC] Initial model response text: {repr(response_message.content)}")
    print(f"[DIAGNOSTIC] tool_calls present? {'YES — ' + ', '.join(tc.function.name for tc in tool_calls) if tool_calls else 'NO'}")
    
    # 2. Safety Net Validation — catch ungrounded text responses
    if not tool_calls:
        final_text = response_message.content or ""
        if re.search(r'\d+\.\d{1,2}|\d+%|gpa|grade|score', final_text.lower()):
            print(f"[DIAGNOSTIC] Safety net TRIGGERED — response contains suspicious patterns, retrying with tool_choice='auto'")
            try:
                response = _call_groq(messages, tools, tool_choice="auto", temperature=0)
            except BadRequestError:
                print("[DIAGNOSTIC] Groq API failed after retries on safety-net call.")
                return "I'm having trouble processing that — could you rephrase your question?"
            response_message = response.choices[0].message
            tool_calls = response_message.tool_calls
            print(f"[DIAGNOSTIC] Safety net retried model response text: {repr(response_message.content)}")
            print(f"[DIAGNOSTIC] tool_calls present after retry? {'YES — ' + ', '.join(tc.function.name for tc in tool_calls) if tool_calls else 'NO'}")

    if tool_calls:
        # Append the assistant's message (which contains the tool calls)
        messages.append(response_message)
        
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            result = _execute_tool(function_name, function_args, matric_number)
            print(f"[DIAGNOSTIC] Executed tool: {function_name}({function_args}), Returned: {result}")
            
            messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": json.dumps(result)
            })
            
        # 3. Final call to model with tool results
        try:
            second_response = _call_groq(messages, tools, tool_choice="auto", temperature=0)
        except BadRequestError:
            print("[DIAGNOSTIC] Groq API failed after retries on final call.")
            return "I'm having trouble processing that — could you rephrase your question?"
        final_text = second_response.choices[0].message.content
        print(f"[DIAGNOSTIC] Final model response: {repr(final_text)}")
        return final_text
        
    return response_message.content
