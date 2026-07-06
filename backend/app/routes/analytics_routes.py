from fastapi import APIRouter, Header, HTTPException, BackgroundTasks
from app.db import supabase
from app.analytics import (
    get_class_average,
    get_grade_distribution,
    get_top_students,
    get_at_risk_students,
    get_pass_fail_rate,
    get_all_carryovers
)
from app.utils.email import send_carryover_notifications_async

router = APIRouter(prefix="/analytics", tags=["Analytics"])

def get_adviser_level(auth_user_id: str):
    if not auth_user_id:
        print("get_adviser_level: No auth_user_id provided")
        return None
    res = supabase.table("advisers").select("level, department").eq("auth_user_id", auth_user_id).execute()
    if res.data:
        lvl = res.data[0].get("level")
        dept = res.data[0].get("department")
        print(f"get_adviser_level received: {auth_user_id} -> Resolves to Dept: {dept}, Level: {lvl}")
        return lvl
    print(f"get_adviser_level received: {auth_user_id} -> No adviser found")
    return None

@router.get("/class-stats/{course_code}")
def get_class_stats(course_code: str):
    return {
        "class_average": get_class_average(course_code),
        "grade_distribution": get_grade_distribution(course_code),
        "pass_fail_rate": get_pass_fail_rate(course_code)
    }

@router.get("/top-students")
def get_top_students_route(limit: int = 5, auth_user_id: str = Header(None)):
    level = get_adviser_level(auth_user_id)
    return get_top_students(limit=limit, level=level)

@router.get("/at-risk")
def get_at_risk_students_route(threshold: float = 2.5, auth_user_id: str = Header(None)):
    level = get_adviser_level(auth_user_id)
    return get_at_risk_students(gpa_threshold=threshold, level=level)

@router.get("/carryovers")
def get_carryovers_route(auth_user_id: str = Header(None)):
    level = get_adviser_level(auth_user_id)
    return get_all_carryovers(level=level)

@router.get("/courses")
def get_courses(auth_user_id: str = Header(None)):
    level = get_adviser_level(auth_user_id)
    
    query = supabase.table("courses").select("course_code")
    if level:
        query = query.eq("level", level)
        
    res = query.execute()
    return [c["course_code"] for c in res.data] if res.data else []

@router.post("/notify-carryovers")
def notify_carryovers_route(background_tasks: BackgroundTasks, auth_user_id: str = Header(None)):
    level = get_adviser_level(auth_user_id)
    carryovers = get_all_carryovers(level=level)
    
    if not carryovers:
        return {"message": "No carryovers found"}
        
    # Get unique matrics
    matrics_with_carryovers = list(set([c["matric_number"] for c in carryovers]))
    
    # Fetch students to get their IDs and emails
    res = supabase.table("students").select("id, matric_number, email").in_("matric_number", matrics_with_carryovers).execute()
    students_data = res.data if res.data else []
    
    db_notifications = []
    email_list = []
    
    for s in students_data:
        db_notifications.append({
            "student_id": s["id"],
            "message": "Reminder: You have outstanding carryover courses. Please check your dashboard and ensure you attend classes for them."
        })
        if s.get("email"):
            email_list.append({
                "email": s["email"],
                "matric": s["matric_number"]
            })
            
    if db_notifications:
        supabase.table("notifications").insert(db_notifications).execute()
        
    if email_list:
        background_tasks.add_task(send_carryover_notifications_async, email_list)
        
    return {"message": f"Notified {len(students_data)} students"}
