from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db import supabase
from app.performance import get_semester_gpa, get_cumulative_gpa, get_course_breakdown

router = APIRouter(prefix="/students", tags=["students"])

class StudentCreate(BaseModel):
    matric_number: str
    name: Optional[str] = None
    department: Optional[str] = None

@router.post("")
def create_student(student: StudentCreate):
    try:
        response = supabase.table("students").insert(student.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to insert student")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
def get_students():
    try:
        response = supabase.table("students").select("*").order("name", desc=False).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{matric_number:path}/gpa/semester")
def get_student_semester_gpa(matric_number: str, semester: str, session: str):
    try:
        response = supabase.table("students").select("id").eq("matric_number", matric_number).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Student not found")
            
        gpa = get_semester_gpa(matric_number, semester, session)
        if gpa is None:
            return {"gpa": None, "message": "no results found"}
        return {"gpa": gpa}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{matric_number:path}/gpa/cumulative")
def get_student_cumulative_gpa(matric_number: str):
    try:
        response = supabase.table("students").select("id, baseline_units, baseline_gps").eq("matric_number", matric_number).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Student not found")
            
        student_data = response.data[0]
        baseline_units = student_data.get("baseline_units") or 0
        baseline_gps = student_data.get("baseline_gps") or 0.0
            
        gpa = get_cumulative_gpa(matric_number, baseline_units, baseline_gps)
        if gpa is None:
            return {"gpa": None, "message": "no results found"}
        return {"gpa": gpa}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.analytics import get_student_carryovers

@router.get("/{matric_number:path}/courses")
def get_student_courses(matric_number: str):
    try:
        response = supabase.table("students").select("id, outstanding_courses").eq("matric_number", matric_number).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Student not found")
            
        student_record = response.data[0]
        
        courses = get_course_breakdown(matric_number)
        
        # Parse previous outstanding courses from broadsheet
        previous_outstanding_str = student_record.get("outstanding_courses") or ""
        import re
        prev_courses = re.findall(r'[A-Za-z]{3}\s*\d{3}', previous_outstanding_str)
        outstanding = [{"course_code": c.upper().replace(" ", "")} for c in prev_courses]
        
        # Add dynamic carryovers from this semester
        if courses:
            dynamic_carryovers = get_student_carryovers(matric_number)
            for dc in dynamic_carryovers:
                if not any(o["course_code"] == dc["course_code"] for o in outstanding):
                    outstanding.append(dc)
                    
        return {"courses": courses if courses else [], "outstanding": outstanding}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{matric_number:path}")
def get_student(matric_number: str):
    try:
        response = supabase.table("students").select("*").eq("matric_number", matric_number).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Student not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
