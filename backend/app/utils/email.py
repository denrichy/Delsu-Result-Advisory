import os
import resend
from dotenv import load_dotenv

load_dotenv()

# We pull the API key from environment variables.
# You will need to add RESEND_API_KEY=your_key to your backend/.env
resend.api_key = os.getenv("RESEND_API_KEY", "")

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
            <a href="http://localhost:5173/app/login" style="display: inline-block; padding: 10px 20px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 5px;">View Dashboard</a>
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
    if not resend.api_key:
        print("RESEND_API_KEY is not set. Skipping email dispatch.")
        return

    for student in student_emails:
        email = student.get("email")
        matric = student.get("matric")
        
        if not email:
            continue
            
        try:
            html_content = render_result_email(matric, semester, session)
            
            # Send via Resend
            # In production, replace the 'from' email with a verified domain you own on Resend.
            # E.g. 'onboarding@resend.dev' is strictly for testing and only sends to the email registered on your Resend account.
            r = resend.Emails.send({
                "from": "Academics <onboarding@resend.dev>",
                "to": email,
                "subject": f"New Results Published - {semester} {session}",
                "html": html_content
            })
            print(f"Sent email to {email}: {r}")
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
            <a href="http://localhost:5173/app/login" style="display: inline-block; padding: 10px 20px; background-color: #c75c5c; color: #ffffff; text-decoration: none; border-radius: 5px;">View Carryovers</a>
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
    if not resend.api_key:
        print("RESEND_API_KEY is not set. Skipping email dispatch.")
        return

    for student in student_emails:
        email = student.get("email")
        matric = student.get("matric")
        
        if not email:
            continue
            
        try:
            html_content = render_carryover_email(matric)
            r = resend.Emails.send({
                "from": "Adviser <onboarding@resend.dev>",
                "to": email,
                "subject": f"Action Required: Outstanding Carryover Courses",
                "html": html_content
            })
            print(f"Sent carryover email to {email}: {r}")
        except Exception as e:
            print(f"Failed to send carryover email to {email}: {e}")
