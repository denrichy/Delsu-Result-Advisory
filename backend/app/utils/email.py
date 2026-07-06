import os
import requests
from dotenv import load_dotenv

load_dotenv()

# We pull the API key from environment variables.
# You will need to add BREVO_API_KEY=your_key to your backend/.env
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
# You MUST verify this sender email in your Brevo dashboard!
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "denrichy111@gmail.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://delsu-result-advisory.vercel.app").rstrip("/")

def render_result_email(matric_number: str, semester: str, session: str) -> str:
    """
    Renders a simple HTML template for the email.
    Using an inline template here to avoid Jinja dependency, 
    but it can easily be swapped out.
    """
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #1a1a1a;">Delsu Result Advisory</h2>
            <p>Hello <strong>{matric_number}</strong>,</p>
            <p>New results have been published for the <strong>{semester}</strong> semester of the <strong>{session}</strong> academic session.</p>
            <p>Please log in to your student dashboard to view your updated academic record and CGPA.</p>
            <br/>
            <a href="{FRONTEND_URL}/app/login" style="display: inline-block; padding: 10px 20px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 5px;">View Dashboard</a>
            <br/><br/>
            <p style="font-size: 12px; color: #666;">
                This is an automated notification from the Delsu Result Advisory System. Please do not reply to this email.
            </p>
        </div>
    </body>
    </html>
    """
    return html

def send_result_notifications_async(student_emails: list[dict], semester: str, session: str):
    """
    This function should be called via FastAPI BackgroundTasks.
    It takes a list of dicts: [{"email": "student@example.com", "matric": "FOS/22/23/123"}]
    """
    if not BREVO_API_KEY:
        print("BREVO_API_KEY is not set. Skipping email dispatch.")
        return

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }

    for student in student_emails:
        email = student.get("email")
        matric = student.get("matric")
        
        if not email:
            continue
            
        try:
            html_content = render_result_email(matric, semester, session)
            
            payload = {
                "sender": {
                    "name": "Compass Academics",
                    "email": BREVO_SENDER_EMAIL
                },
                "to": [{"email": email}],
                "subject": f"New Results Published - {semester} {session}",
                "htmlContent": html_content
            }
            
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            print(f"Sent email to {email}: {response.json()}")
        except Exception as e:
            print(f"Failed to send email to {email}: {e}")

def render_carryover_email(matric_number: str) -> str:
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #1a1a1a;">Important Academic Notice</h2>
            <p>Hello <strong>{matric_number}</strong>,</p>
            <p>This is a reminder from your academic adviser. You have outstanding carryover courses that require your attention.</p>
            <p>Please log in to your student portal to review your carryover courses, and ensure you register and attend classes for them.</p>
            <br/>
            <a href="{FRONTEND_URL}/app/login" style="display: inline-block; padding: 10px 20px; background-color: #c75c5c; color: #ffffff; text-decoration: none; border-radius: 5px;">View Carryovers</a>
            <br/><br/>
            <p style="font-size: 12px; color: #666;">
                This is an automated notification from the Delsu Result Advisory System. Please do not reply to this email.
            </p>
        </div>
    </body>
    </html>
    """
    return html

def send_carryover_notifications_async(student_emails: list[dict]):
    if not BREVO_API_KEY:
        print("BREVO_API_KEY is not set. Skipping email dispatch.")
        return

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }

    for student in student_emails:
        email = student.get("email")
        matric = student.get("matric")
        
        if not email:
            continue
            
        try:
            html_content = render_carryover_email(matric)
            
            payload = {
                "sender": {
                    "name": "Compass Adviser",
                    "email": BREVO_SENDER_EMAIL
                },
                "to": [{"email": email}],
                "subject": "Action Required: Outstanding Carryover Courses",
                "htmlContent": html_content
            }
            
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            print(f"Sent carryover email to {email}: {response.json()}")
        except Exception as e:
            print(f"Failed to send carryover email to {email}: {e}")
