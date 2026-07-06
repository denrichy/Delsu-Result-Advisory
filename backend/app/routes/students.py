from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db import supabase
from app.performance import get_semester_gpa, get_cumulative_gpa, get_course_breakdown, get_full_academic_record

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


@router.get("/{matric_number:path}/courses")
def get_student_courses(matric_number: str):
    try:
        record = get_full_academic_record(matric_number)
        if "error" in record:
            raise HTTPException(status_code=404, detail=record["error"])
            
        return {
            "courses": record.get("courses", []),
            "outstanding": record.get("outstanding_courses", []),
            "previous_outstanding": record.get("previous_outstanding", []),
            "current_outstanding": record.get("current_outstanding", [])
        }
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
