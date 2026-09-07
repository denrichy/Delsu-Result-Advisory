from fastapi import APIRouter, Header, HTTPException, BackgroundTasks
from app.db import supabase
from app.analytics import (
    get_class_average,
    get_grade_distribution,
    get_top_students,
    get_at_risk_students,
    get_pass_fail_rate,
    get_all_carryovers,
    _get_bulk_student_data
)
from app.performance import calculate_gpa
from app.utils.email import send_carryover_notifications_async

router = APIRouter(prefix="/analytics", tags=["Analytics"])

def get_adviser_info(auth_user_id: str):
    if not auth_user_id:
        print("get_adviser_info: No auth_user_id provided")
        return None
    res = supabase.table("advisers").select("id, level, department").eq("auth_user_id", auth_user_id).execute()
    if res.data:
        lvl = res.data[0].get("level")
        dept = res.data[0].get("department")
        adv_id = res.data[0].get("id")
        print(f"get_adviser_info received: {auth_user_id} -> Resolves to ID: {adv_id}, Dept: {dept}, Level: {lvl}")
        return {
            "id": adv_id,
            "level": lvl,
            "department": dept
        }
    print(f"get_adviser_info received: {auth_user_id} -> No adviser found")
    return None

def get_adviser_level(auth_user_id: str):
    info = get_adviser_info(auth_user_id)
    return info.get("level") if info else None

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


@router.get("/dashboard-summary")
def get_dashboard_summary(auth_user_id: str = Header(None)):
    adviser_info = get_adviser_info(auth_user_id)
    level = adviser_info.get("level") if adviser_info else None
    adviser_id = adviser_info.get("id") if adviser_info else None

    # 1. Total students at adviser's level
    students_query = supabase.table("students").select("id")
    if level is not None:
        students_query = students_query.eq("current_level", level)
    students_res = students_query.execute()
    total_students = len(students_res.data) if students_res.data else 0

    # Profiles & CGPA calculations
    profiles = _get_bulk_student_data(level)
    if len(profiles) > total_students:
        total_students = len(profiles)

    all_gpas = []
    cgpa_distribution = {
        "first_class": 0,
        "second_upper": 0,
        "second_lower": 0,
        "third_class": 0,
        "pass_degree": 0,
        "fail": 0
    }

    for p in profiles:
        gpa = calculate_gpa(p["results"], p.get("baseline_units", 0), p.get("baseline_gps", 0.0))
        if gpa is not None:
            all_gpas.append(gpa)
            if gpa >= 4.5:
                cgpa_distribution["first_class"] += 1
            elif gpa >= 3.5:
                cgpa_distribution["second_upper"] += 1
            elif gpa >= 2.4:
                cgpa_distribution["second_lower"] += 1
            elif gpa >= 1.5:
                cgpa_distribution["third_class"] += 1
            elif gpa >= 1.0:
                cgpa_distribution["pass_degree"] += 1
            else:
                cgpa_distribution["fail"] += 1

    # 2. Average CGPA
    average_cgpa = round(sum(all_gpas) / len(all_gpas), 2) if all_gpas else 0.0

    # 6. Top 5 students by GPA (reuse existing get_top_students)
    top_students = get_top_students(limit=5, level=level)

    # 7. At-risk students with GPA < 2.0 (reuse existing get_at_risk_students)
    at_risk_students = get_at_risk_students(gpa_threshold=2.0, level=level)

    # 3. At-risk count
    at_risk_count = len(at_risk_students)

    # 4. Carryover count (unique students with carryovers)
    carryovers = get_all_carryovers(level=level)
    carryover_count = len(set(c["matric_number"] for c in carryovers if c.get("matric_number")))

    # 8. Recent uploads (last 5 uploads by this adviser)
    recent_uploads = []
    if adviser_id:
        uploads_res = (
            supabase.table("uploads")
            .select("*")
            .eq("adviser_id", adviser_id)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        recent_uploads = uploads_res.data if uploads_res.data else []

    return {
        "adviser": adviser_info,
        "total_students": total_students,
        "average_cgpa": average_cgpa,
        "at_risk_count": at_risk_count,
        "carryover_count": carryover_count,
        "cgpa_distribution": cgpa_distribution,
        "top_students": top_students,
        "at_risk_students": at_risk_students,
        "recent_uploads": recent_uploads
    }
