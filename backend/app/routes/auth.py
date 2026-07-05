from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import supabase
import traceback

router = APIRouter(prefix="/auth", tags=["auth"])

class StudentSignup(BaseModel):
    name: str
    matric_number: str
    email: str
    auth_user_id: str

class AdviserSignup(BaseModel):
    name: str
    email: str
    department: str
    level: int
    auth_user_id: str

def check_role_conflict(auth_user_id: str):
    tables = [("student", "students"), ("adviser", "advisers"), ("admin", "admins")]
    for role, table in tables:
        res = supabase.table(table).select("auth_user_id").eq("auth_user_id", auth_user_id).execute()
        if res.data:
            return role
    return None

@router.post("/student-signup")
def student_signup(data: StudentSignup):
    try:
        # Cross-role conflict check
        existing_role = check_role_conflict(data.auth_user_id)
        if existing_role:
            raise HTTPException(status_code=400, detail=f"This account is already registered as a {existing_role}. One account can only have one role.")

        matric = data.matric_number.strip().upper()
        
        # Check if student exists
        res = supabase.table("students").select("*").eq("matric_number", matric).execute()
        
        if res.data:
            existing = res.data[0]
            if existing.get("auth_user_id"):
                raise HTTPException(status_code=400, detail="Account already claimed by another user.")
            
            # Update the existing record
            update_data = {
                "email": data.email,
                "auth_user_id": data.auth_user_id
            }
            # Always update name to what they provided during signup (since they know their own name)
            update_data["name"] = data.name
            
            update_res = supabase.table("students").update(update_data).eq("matric_number", matric).execute()
            
            if not update_res.data:
                raise HTTPException(status_code=500, detail="Failed to claim account.")
            return update_res.data[0]
            
        else:
            # Insert new record
            insert_res = supabase.table("students").insert({
                "matric_number": matric,
                "name": data.name,
                "email": data.email,
                "auth_user_id": data.auth_user_id
            }).execute()
            
            if not insert_res.data:
                raise HTTPException(status_code=500, detail="Failed to create student.")
            return insert_res.data[0]
            
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/adviser-signup")
def adviser_signup(data: AdviserSignup):
    try:
        # Cross-role conflict check
        existing_role = check_role_conflict(data.auth_user_id)
        if existing_role:
            raise HTTPException(status_code=400, detail=f"This account is already registered as a {existing_role}. One account can only have one role.")

        # Check for conflict: same department and same level, verified=true, revoked=false
        conflict_res = supabase.table("advisers").select("*").eq("department", data.department).eq("level", data.level).eq("verified", True).eq("revoked", False).execute()
        if conflict_res.data:
            raise HTTPException(status_code=400, detail=f"An adviser is already assigned to {data.department} - {data.level} Level. Contact admin if this needs to change.")

        res = supabase.table("advisers").select("*").eq("email", data.email).execute()
        if res.data:
            if res.data[0].get("auth_user_id"):
                raise HTTPException(status_code=400, detail="Email already claimed by another adviser.")
            
        insert_res = supabase.table("advisers").insert({
            "name": data.name,
            "email": data.email,
            "department": data.department,
            "level": data.level,
            "auth_user_id": data.auth_user_id,
            "verified": False
        }).execute()
        
        if not insert_res.data:
            raise HTTPException(status_code=500, detail="Failed to create adviser.")
        return insert_res.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/student-profile/{auth_user_id}")
def get_student_profile(auth_user_id: str):
    try:
        res = supabase.table("students") \
            .select("id, matric_number, name, email, auth_user_id, department") \
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
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/adviser-profile/{auth_user_id}")
def get_adviser_profile(auth_user_id: str):
    try:
        res = supabase.table("advisers") \
            .select("id, name, email, department, verified, revoked, auth_user_id") \
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
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

