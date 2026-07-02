from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db import supabase

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
        response = supabase.table("students").select("*").execute()
        return response.data
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
