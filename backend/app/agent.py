import os
import json
import re
from pathlib import Path
from groq import Groq, BadRequestError, RateLimitError
from dotenv import load_dotenv

# Load .env from the backend directory (parent of this file's directory)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

from app.performance import get_semester_gpa, get_cumulative_gpa, get_course_breakdown, get_full_academic_record, simulate_gpa, simulate_gpa_uniform, check_graduation_prospects

# Maximum retries for Groq tool_use_failed errors
MAX_RETRIES = 2

def _call_groq(messages, tools, tool_choice="auto", temperature=0):
    """Wrapper around the Groq API call with retry logic for tool_use_failed errors."""
    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model="openai/gpt-oss-120b",
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
    elif function_name == "get_full_academic_record":
        return get_full_academic_record(matric_number)
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
    elif function_name == "check_graduation_prospects":
        return check_graduation_prospects(matric_number)
    else:
        return {"error": f"Unknown function {function_name}"}

def run_agent(matric_number: str, user_message: str, conversation_history=None):
    if conversation_history is None:
        conversation_history = []
    
    # Trim conversation history to the last 8 messages (4 user + 4 assistant turns)
    conversation_history = conversation_history[-8:]
    
    student_name = "Student"
    student_dept = "Computer Science"
    
    try:
        from app.db import supabase
        res = supabase.table("students").select("name, department").eq("matric_number", matric_number).execute()
        if res.data:
            student_name = res.data[0].get("name") or "Student"
            student_dept = res.data[0].get("department") or "Computer Science"
    except Exception as e:
        print(f"[DIAGNOSTIC] Failed to fetch student metadata for agent: {e}")
    
    system_prompt = (
        f"You are Compass, an academic advisory assistant for a DELSU student. \n"
        f"The student you are talking to is {student_name}, a student in the {student_dept} department, with matric number {matric_number}.\n"
        "You're warm, direct, and conversational — not robotic. \n\n"
        "You have access to tools that retrieve the student's real academic data \n"
        "(GPA, course scores, breakdowns, outstanding courses, carryovers). Always use these tools to answer any \n"
        "question about their performance, grades, outstanding courses, or academic standing — never \n"
        "guess or estimate numbers. Recognize varied ways students might ask the \n"
        "same thing (e.g. 'how am I doing', 'am I on track', 'what carryovers do I have', 'should I be worried' \n"
        "all relate to their GPA/performance).\n\n"
        "CRITICAL RULE: Do NOT mention the names of your internal tools (e.g. 'check_graduation_prospects', 'get_full_academic_record') "
        "to the student. Frame your responses naturally, as if you are directly accessing their records.\n\n"
        "CRITICAL RULE: If the student asks you for their name, department, or matric number, ALWAYS answer them directly using the information provided above. Do not treat it as small talk or an unrelated topic.\n\n"
        "When the student asks a broad, holistic question about their overall academic standing \n"
        "(e.g., 'how am I doing academically', 'give me a summary of my performance', 'am I on track'), \n"
        "ALWAYS use the get_full_academic_record tool. Do NOT just fetch a single metric like their cumulative GPA. \n"
        "Use the full record to give them a comprehensive breakdown: their CGPA, class of degree, total units, \n"
        "and their outstanding carryover courses. Provide holistic advice based on that full picture.\n\n"
        "When a student asks how their CGPA or GPA was calculated, ALWAYS use get_full_academic_record to retrieve "
        "their 'total_units' and 'total_quality_points'. Show them the actual math (e.g., Total Quality Points ÷ Total Units = CGPA) "
        "using their real data. Keep the explanation transparent but concise — do not dump their entire course list unless requested.\n\n"
        "When asked about carryovers or outstanding courses, use the get_full_academic_record tool. \n"
        "The returned 'outstanding_courses' array contains their TOTAL number of carryovers. \n"
        "'previous_outstanding' contains older carryovers from past sessions, while \n"
        "'current_outstanding' contains newly failed courses from the current session. \n"
        "Always give the TOTAL number of carryovers first, and if appropriate, break them down by previous vs current. \n"
        "Additionally, the 'at_risk_courses' array contains courses where the student barely passed (Grade D, 45-49). \n"
        "Proactively warn them about these At-Risk courses as they drag down their CGPA, and suggest they focus on improving in similar future subjects.\n"
        "NEVER claim they only have carryovers from the current session if 'previous_outstanding' is populated.\n\n"
        "You can have natural conversation — greetings, small talk, follow-up \n"
        "questions — but you stay in character as an academic advisor. If the \n"
        "student greets you (hello, hi, good day, good morning, how are you, etc.) \n"
        "or makes small talk or acknowledges your previous answer (e.g. 'okay', \n"
        "'thanks', 'got it'), respond warmly and naturally — a short greeting \n"
        "back, maybe ask how their day/studies are going. Do NOT call any tool \n"
        "for a plain greeting or acknowledgment with no academic question attached. \n"
        "Never return an empty or overly clipped response. If asked something \n"
        "entirely unrelated to academics (general trivia, other topics), politely \n"
        "acknowledge it briefly and warmly redirect back to what you can help \n"
        "with — don't fully answer unrelated questions at length, and don't be \n"
        "curt about declining.\n\n"
        "CRITICAL SAFETY RULE: If a student ever expresses thoughts of self-harm, severe depression, \n"
        "or feeling like they can't go on, you must provide compassionate support. \n"
        "Respond like a highly empathetic human: be brief, supportive, and natural. Do not sound forced or robotic. \n"
        "Gently encourage them to talk to a professional, such as the university counseling unit, or someone they trust. \n"
        "If they are struggling academically and it's weighing them down, silently call the get_full_academic_record tool \n"
        "to see their actual standing. Then, respond naturally based on their data. If they are doing well, encourage them; \n"
        "if they are struggling, offer realistic, gentle academic advice. \n"
        "IMPORTANT: NEVER say 'I will check your records' or 'Let me use the tool'. Just silently use the tool and reply. \n"
        "NEVER output raw tool tags (e.g., <function=...>) or mention tool names in your final text.\n\n"
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
        "class of degree, or 'being on track' unless you have used the check_graduation_prospects tool to verify it. "
        "When asked if a specific class of degree (e.g., First Class) is possible, always use check_graduation_prospects "
        "to get the exact mathematical breakdown and present it clearly to the student.\n\n"
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
        "You must ONLY call tools from the tools list provided to you. Never invent or \n"
        "reference a tool name that isn't in that list.\n\n"
        "FORMATTING AND TONE RULES:\n"
        "1. Be highly concise. Give the student the exact answer they need without walls of text or over-explaining.\n"
        "2. Do NOT pad responses with unnecessary caveats or repetitions.\n"
        "3. PLAIN TEXT ONLY. You must absolutely NEVER use Markdown formatting. Do NOT use asterisks (**) for bolding, do NOT use hashes (#) for headers, do NOT use pipes (|) to create tables, and do NOT use bullet points. Write in completely clean, plain text paragraphs and sentences."
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
                "name": "get_full_academic_record",
                "description": "Get the student's full academic profile, including their overall CGPA, course breakdown, outstanding courses (carryovers), and total units.",
                "parameters": {
                    "type": "object",
                    "properties": {},
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "check_graduation_prospects",
                "description": "Calculate the absolute maximum possible CGPA the student can achieve, and check if specific degree classes (e.g., First Class) are mathematically possible given their current standing.",
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
    except RateLimitError:
        print("[DIAGNOSTIC] Groq API RateLimitError.")
        return "I've reached my daily processing limit. Please try asking again tomorrow or let your administrator know."

    response_message = response.choices[0].message
    
    print(f"\n[DIAGNOSTIC] User message: {repr(user_message)}")
    print(f"[DIAGNOSTIC] Initial model response text: {repr(response_message.content)}")
    
    # 2. Safety Net Validation — catch ungrounded text responses on initial call
    if not response_message.tool_calls:
        final_text = response_message.content or ""
        if re.search(r'\d+\.\d{1,2}|\d+%|gpa|grade|score', final_text.lower()):
            print(f"[DIAGNOSTIC] Safety net TRIGGERED — response contains suspicious patterns, retrying with tool_choice='auto'")
            try:
                response = _call_groq(messages, tools, tool_choice="auto", temperature=0)
                response_message = response.choices[0].message
                print(f"[DIAGNOSTIC] Safety net retried model response text: {repr(response_message.content)}")
            except BadRequestError:
                print("[DIAGNOSTIC] Groq API failed after retries on safety-net call.")
                return "I'm having trouble processing that — could you rephrase your question?"
            except RateLimitError:
                print("[DIAGNOSTIC] Groq API RateLimitError.")
                return "I've reached my daily processing limit. Please try asking again tomorrow or let your administrator know."

    # 3. Tool Execution Loop
    max_iterations = 5
    iterations = 0
    last_tool_result = None
    
    while response_message.tool_calls and iterations < max_iterations:
        iterations += 1
        tool_calls = response_message.tool_calls
        print(f"[DIAGNOSTIC] Iteration {iterations}: tool_calls present? {'YES — ' + ', '.join(tc.function.name for tc in tool_calls)}")
        
        messages.append(response_message)
        
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            result = _execute_tool(function_name, function_args, matric_number)
            last_tool_result = result
            print(f"[DIAGNOSTIC] Executed tool: {function_name}({function_args}), Returned: {result}")
            
            if result is None:
                tool_response_content = json.dumps({"status": "No records found or GPA calculation returned empty."})
            elif isinstance(result, (int, float, str)):
                tool_response_content = json.dumps({f"{function_name}_result": result})
            else:
                tool_response_content = json.dumps(result)
                
            messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": tool_response_content
            })
            
        try:
            response = _call_groq(messages, tools, tool_choice="auto", temperature=0)
            response_message = response.choices[0].message
        except BadRequestError:
            print("[DIAGNOSTIC] Groq API failed after retries on subsequent tool call.")
            return "I'm having trouble processing that — could you rephrase your question?"
        except RateLimitError:
            print("[DIAGNOSTIC] Groq API RateLimitError.")
            return "I've reached my daily processing limit. Please try asking again later or let your administrator know."

    # 4. Final Text Extraction & Fallback
    final_text = response_message.content
    
    if not final_text or not final_text.strip():
        print("[DIAGNOSTIC] Final response is empty. Forcing a retry with explicit instructions.")
        messages.append({
            "role": "user",
            "content": "Summarize the tool result above in a clear, direct sentence for the student. Do not return an empty response." if iterations > 0 else "Please respond warmly to the greeting or small talk above. Do not return an empty response."
        })
        try:
            retry_response = _call_groq(messages, tools, tool_choice="none", temperature=0)
            final_text = retry_response.choices[0].message.content
        except (BadRequestError, RateLimitError):
            pass
            
        if not final_text or not final_text.strip():
            print("[DIAGNOSTIC] Fallback to raw Python string because model returned empty twice.")
            if iterations > 0:
                if last_tool_result is None:
                    final_text = "I couldn't find any results for that query."
                elif isinstance(last_tool_result, (int, float)):
                    final_text = f"Your result is {last_tool_result}."
                elif isinstance(last_tool_result, dict) and "hypothetical_gpa" in last_tool_result:
                    final_text = f"Your hypothetical GPA would be {last_tool_result['hypothetical_gpa']}."
                elif isinstance(last_tool_result, list):
                    if len(last_tool_result) == 0:
                        final_text = "There are no records to show."
                    else:
                        final_text = f"I found {len(last_tool_result)} records matching your query."
                else:
                    final_text = f"Here is the result: {last_tool_result}"
            else:
                final_text = "I'm here to help with your academic advising. How can I assist you today?"
                
    # Programmatically strip markdown symbols just in case the model ignores prompt rules
    if final_text:
        final_text = final_text.replace('*', '').replace('#', '').replace('|', '').replace('`', '')
        
    print(f"[DIAGNOSTIC] Final model response: {repr(final_text)}")
    return final_text


def generate_title_background_with_context(session_id: str, user_message: str, ai_message: str):
    """Generate a title for the chat session based on the user message and AI response."""
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": "You are a title generator. Generate a concise, 2-4 word title for this conversation based on the user's prompt and your response. Do not use quotes or punctuation."},
                {"role": "user", "content": user_message},
                {"role": "assistant", "content": ai_message}
            ],
            temperature=0.3
        )
        title = response.choices[0].message.content.strip().strip('"').strip("'")
        if title:
            from app.db import supabase
            supabase.table("chat_sessions").update({"title": title}).eq("id", session_id).execute()
    except Exception as e:
        print(f"[DIAGNOSTIC] Failed to generate title in background: {e}")


def run_agent_stream(matric_number: str, user_message: str, conversation_history=None, session_id=None):
    """Run the agent but stream the final textual output using Server-Sent Events."""
    if conversation_history is None:
        conversation_history = []
    
    # Trim conversation history to the last 8 messages (4 user + 4 assistant turns)
    conversation_history = conversation_history[-8:]
    
    # We use the exact same system prompt and tools setup as run_agent.
    # To avoid repeating 150 lines, we will extract them or just duplicate them here.
    # For simplicity, we just duplicate the system prompt and tools list.
    student_name = "Student"
    student_dept = "Computer Science"
    
    try:
        from app.db import supabase
        res = supabase.table("students").select("name, department").eq("matric_number", matric_number).execute()
        if res.data:
            student_name = res.data[0].get("name") or "Student"
            student_dept = res.data[0].get("department") or "Computer Science"
    except Exception as e:
        print(f"[DIAGNOSTIC] Failed to fetch student metadata for agent: {e}")
    
    system_prompt = (
        f"You are Compass, an academic advisory assistant for a DELSU student. \n"
        f"The student you are talking to is {student_name}, a student in the {student_dept} department, with matric number {matric_number}.\n"
        "You're warm, direct, and conversational — not robotic. \n\n"
        "You have access to tools that retrieve the student's real academic data \n"
        "(GPA, course scores, breakdowns, outstanding courses, carryovers). Always use these tools to answer any \n"
        "question about their performance, grades, outstanding courses, or academic standing — never \n"
        "guess or estimate numbers. Recognize varied ways students might ask the \n"
        "same thing (e.g. 'how am I doing', 'am I on track', 'what carryovers do I have', 'should I be worried' \n"
        "all relate to their GPA/performance).\n\n"
        "CRITICAL RULE: Do NOT mention the names of your internal tools (e.g. 'check_graduation_prospects', 'get_full_academic_record') "
        "to the student. Frame your responses naturally, as if you are directly accessing their records.\n\n"
        "CRITICAL RULE: If the student asks you for their name, department, or matric number, ALWAYS answer them directly using the information provided above. Do not treat it as small talk or an unrelated topic.\n\n"
        "When the student asks a broad, holistic question about their overall academic standing \n"
        "(e.g., 'how am I doing academically', 'give me a summary of my performance', 'am I on track'), \n"
        "ALWAYS use the get_full_academic_record tool. Do NOT just fetch a single metric like their cumulative GPA. \n"
        "Use the full record to give them a comprehensive breakdown: their CGPA, class of degree, total units, \n"
        "and their outstanding carryover courses. Provide holistic advice based on that full picture.\n\n"
        "When a student asks how their CGPA or GPA was calculated, ALWAYS use get_full_academic_record to retrieve "
        "their 'total_units' and 'total_quality_points'. Show them the actual math (e.g., Total Quality Points ÷ Total Units = CGPA) "
        "using their real data. Keep the explanation transparent but concise — do not dump their entire course list unless requested.\n\n"
        "When asked about carryovers or outstanding courses, use the get_full_academic_record tool. \n"
        "The returned 'outstanding_courses' array contains their TOTAL number of carryovers. \n"
        "'previous_outstanding' contains older carryovers from past sessions, while \n"
        "'current_outstanding' contains newly failed courses from the current session. \n"
        "Always give the TOTAL number of carryovers first, and if appropriate, break them down by previous vs current. \n"
        "Additionally, the 'at_risk_courses' array contains courses where the student barely passed (Grade D, 45-49). \n"
        "Proactively warn them about these At-Risk courses as they drag down their CGPA, and suggest they focus on improving in similar future subjects.\n"
        "NEVER claim they only have carryovers from the current session if 'previous_outstanding' is populated.\n\n"
        "You can have natural conversation — greetings, small talk, follow-up \n"
        "questions — but you stay in character as an academic advisor. If the \n"
        "student greets you (hello, hi, good day, good morning, how are you, etc.) \n"
        "or makes small talk or acknowledges your previous answer (e.g. 'okay', \n"
        "'thanks', 'got it'), respond warmly and naturally — a short greeting \n"
        "back, maybe ask how their day/studies are going. Do NOT call any tool \n"
        "for a plain greeting or acknowledgment with no academic question attached. \n"
        "Never return an empty or overly clipped response. If asked something \n"
        "entirely unrelated to academics (general trivia, other topics), politely \n"
        "acknowledge it briefly and warmly redirect back to what you can help \n"
        "with — don't fully answer unrelated questions at length, and don't be \n"
        "curt about declining.\n\n"
        "CRITICAL SAFETY RULE: If a student ever expresses thoughts of self-harm, severe depression, \n"
        "or feeling like they can't go on, you must provide compassionate support. \n"
        "Respond like a highly empathetic human: be brief, supportive, and natural. Do not sound forced or robotic. \n"
        "Gently encourage them to talk to a professional, such as the university counseling unit, or someone they trust. \n"
        "If they are struggling academically and it's weighing them down, silently call the get_full_academic_record tool \n"
        "to see their actual standing. Then, respond naturally based on their data. If they are doing well, encourage them; \n"
        "if they are struggling, offer realistic, gentle academic advice. \n"
        "IMPORTANT: NEVER say 'I will check your records' or 'Let me use the tool'. Just silently use the tool and reply. \n"
        "NEVER output raw tool tags (e.g., <function=...>) or mention tool names in your final text.\n\n"
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
        "class of degree, or 'being on track' unless you have used the check_graduation_prospects tool to verify it. "
        "When asked if a specific class of degree (e.g., First Class) is possible, always use check_graduation_prospects "
        "to get the exact mathematical breakdown and present it clearly to the student.\n\n"
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
        "You must ONLY call tools from the tools list provided to you. Never invent or \n"
        "reference a tool name that isn't in that list.\n\n"
        "FORMATTING AND TONE RULES:\n"
        "1. Be highly concise. Give the student the exact answer they need without walls of text or over-explaining.\n"
        "2. Do NOT pad responses with unnecessary caveats or repetitions.\n"
        "3. PLAIN TEXT ONLY. You must absolutely NEVER use Markdown formatting. Do NOT use asterisks (**) for bolding, do NOT use hashes (#) for headers, do NOT use pipes (|) to create tables, and do NOT use bullet points. Write in completely clean, plain text paragraphs and sentences."
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
                "name": "get_full_academic_record",
                "description": "Get the student's full academic profile, including their overall CGPA, course breakdown, outstanding courses (carryovers), and total units.",
                "parameters": {
                    "type": "object",
                    "properties": {},
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "check_graduation_prospects",
                "description": "Calculate the absolute maximum possible CGPA the student can achieve, and check if specific degree classes (e.g., First Class) are mathematically possible given their current standing.",
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

    # 1. First call to model — synchronous, tool execution
    try:
        response = _call_groq(messages, tools, tool_choice="auto", temperature=0)
    except BadRequestError:
        yield f"data: {json.dumps({'content': 'I am having trouble processing that — could you rephrase your question?'})}\n\n"
        yield "data: [DONE]\n\n"
        return
    except RateLimitError:
        yield f"data: {json.dumps({'content': 'I have reached my daily processing limit. Please try asking again tomorrow or let your administrator know.'})}\n\n"
        yield "data: [DONE]\n\n"
        return

    response_message = response.choices[0].message
    
    # 2. Safety Net Validation
    if not response_message.tool_calls:
        final_text = response_message.content or ""
        if re.search(r'\d+\.\d{1,2}|\d+%|gpa|grade|score', final_text.lower()):
            try:
                response = _call_groq(messages, tools, tool_choice="auto", temperature=0)
                response_message = response.choices[0].message
            except (BadRequestError, RateLimitError):
                pass

    # 3. Tool Execution Loop
    max_iterations = 5
    iterations = 0
    
    while response_message.tool_calls and iterations < max_iterations:
        iterations += 1
        tool_calls = response_message.tool_calls
        messages.append(response_message)
        
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            result = _execute_tool(function_name, function_args, matric_number)
            
            if result is None:
                tool_response_content = json.dumps({"status": "No records found or GPA calculation returned empty."})
            elif isinstance(result, (int, float, str)):
                tool_response_content = json.dumps({f"{function_name}_result": result})
            else:
                tool_response_content = json.dumps(result)
                
            messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": tool_response_content
            })
            
        try:
            response = _call_groq(messages, tools, tool_choice="auto", temperature=0)
            response_message = response.choices[0].message
        except BadRequestError:
            yield f"data: {json.dumps({'content': 'I am having trouble processing that — could you rephrase your question?'})}\n\n"
            yield "data: [DONE]\n\n"
            return
        except RateLimitError:
            yield f"data: {json.dumps({'content': 'I have reached my daily processing limit. Please try asking again later.'})}\n\n"
            yield "data: [DONE]\n\n"
            return

    # 4. Final text generation with streaming
    # We now call Groq with stream=True and yield the chunks
    messages.append({
        "role": "user",
        "content": "Provide your final response based on the above information." if iterations > 0 else "Please respond warmly to the greeting or small talk above."
    })
    
    full_response = ""
    try:
        stream_response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages,
            tools=tools,
            tool_choice="none",
            temperature=0,
            stream=True
        )
        for chunk in stream_response:
            if chunk.choices and chunk.choices[0].delta.content:
                text = chunk.choices[0].delta.content
                text = text.replace('*', '').replace('#', '').replace('|', '').replace('`', '')
                if text:
                    full_response += text
                    yield f"data: {json.dumps({'content': text})}\n\n"
    except Exception as e:
        print(f"[DIAGNOSTIC] Stream error: {e}")
        if not full_response:
            fallback = "Sorry, I encountered an error while generating my response."
            full_response = fallback
            yield f"data: {json.dumps({'content': fallback})}\n\n"
            
    if not full_response.strip():
        fallback = "I couldn't find any results for that query."
        full_response = fallback
        yield f"data: {json.dumps({'content': fallback})}\n\n"
        
    yield "data: [DONE]\n\n"
    
    # Save AI response to DB if session exists
    if session_id:
        try:
            from app.db import supabase
            supabase.table("chat_messages").insert({
                "session_id": session_id,
                "role": "assistant",
                "content": full_response,
            }).execute()

            # Trigger background title generation if this is the first turn
            if len(conversation_history) == 0:
                import threading
                threading.Thread(target=generate_title_background_with_context, args=(session_id, user_message, full_response)).start()
        except Exception as e:
            print(f"[DIAGNOSTIC] Failed to save stream message to DB: {e}")

