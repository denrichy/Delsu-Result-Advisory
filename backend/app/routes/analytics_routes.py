from fastapi import APIRouter
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

@router.get("/class-stats/{course_code}")
def get_class_stats(course_code: str):
    return {
        "class_average": get_class_average(course_code),
        "grade_distribution": get_grade_distribution(course_code),
        "pass_fail_rate": get_pass_fail_rate(course_code)
    }

@router.get("/top-students")
def get_top_students_route(limit: int = 5):
    return get_top_students(limit=limit)

@router.get("/at-risk")
def get_at_risk_students_route(threshold: float = 2.5):
    return get_at_risk_students(gpa_threshold=threshold)

@router.get("/carryovers")
def get_carryovers_route():
    return get_all_carryovers()

@router.get("/courses")
def get_courses():
    res = supabase.table("courses").select("course_code").execute()
    return [c["course_code"] for c in res.data] if res.data else []
