import asyncio
from app.utils.email import render_carryover_email, send_carryover_notifications_async

student_emails = [{"email": "test@example.com", "matric": "123", "courses": ["CSC401"]}]
try:
    html = render_carryover_email("123", ["CSC401"])
    send_carryover_notifications_async(student_emails)
    print("Success")
except Exception as e:
    print(f"Error: {e}")
