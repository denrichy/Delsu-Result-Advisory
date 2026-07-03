from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import supabase

router = APIRouter(prefix="/auth", tags=["auth"])

class StudentSignup(BaseModel):
    matric_number: str
    email: str
    auth_user_id: str

class AdviserSignup(BaseModel):
    name: str
    email: str
    department: str
    auth_user_id: str

@router.post("/student-signup")
def student_signup(data: StudentSignup):
    try:
        # Check if student exists
        res = supabase.table("students").select("*").eq("matric_number", data.matric_number).execute()
        
        if res.data:
            existing = res.data[0]
            if existing.get("auth_user_id"):
                raise HTTPException(status_code=400, detail="Account already claimed by another user.")
            
            # Update the existing record
            update_res = supabase.table("students").update({
                "email": data.email,
                "auth_user_id": data.auth_user_id
            }).eq("matric_number", data.matric_number).execute()
            
            if not update_res.data:
                raise HTTPException(status_code=500, detail="Failed to claim account.")
            return update_res.data[0]
            
        else:
            # Insert new record
            insert_res = supabase.table("students").insert({
                "matric_number": data.matric_number,
                "email": data.email,
                "auth_user_id": data.auth_user_id
            }).execute()
            
            if not insert_res.data:
                raise HTTPException(status_code=500, detail="Failed to create student.")
            return insert_res.data[0]
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/adviser-signup")
def adviser_signup(data: AdviserSignup):
    try:
        res = supabase.table("advisers").select("*").eq("email", data.email).execute()
        if res.data:
            if res.data[0].get("auth_user_id"):
                raise HTTPException(status_code=400, detail="Email already claimed by another adviser.")
            
        insert_res = supabase.table("advisers").insert({
            "name": data.name,
            "email": data.email,
            "department": data.department,
            "auth_user_id": data.auth_user_id,
            "verified": False
        }).execute()
        
        if not insert_res.data:
            raise HTTPException(status_code=500, detail="Failed to create adviser.")
        return insert_res.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/student-profile/{auth_user_id}")
def get_student_profile(auth_user_id: str):
    try:
        res = supabase.table("students") \
            .select("matric_number, name, email, auth_user_id, department") \
            .eq("auth_user_id", auth_user_id) \
            .execute()

        if not res.data:
            return {"found": False}

        student_data = res.data[0]
        student_data["found"] = True
        return student_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/adviser-profile/{auth_user_id}")
def get_adviser_profile(auth_user_id: str):
    try:
        res = supabase.table("advisers") \
            .select("id, name, email, department, verified, auth_user_id") \
            .eq("auth_user_id", auth_user_id) \
            .execute()

        if not res.data:
            return {"found": False}

        adviser_data = res.data[0]
        adviser_data["found"] = True
        return adviser_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

