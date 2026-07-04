from fastapi import APIRouter, Header, HTTPException
from app.db import supabase
from app.analytics import (
    get_class_average,
    get_grade_distribution,
    get_top_students,
    get_at_risk_students,
    get_pass_fail_rate,
    get_all_carryovers
)

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
