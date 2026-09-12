import re

with open("backend/app/routes/analytics_routes.py", "r") as f:
    content = f.read()

content = content.replace("background_tasks.add_task(send_carryover_notifications_async, email_list)",
                          "send_carryover_notifications_async(email_list)")

with open("backend/app/routes/analytics_routes.py", "w") as f:
    f.write(content)
