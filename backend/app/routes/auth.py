from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.db import supabase
from app.security import CurrentUser, get_current_user
import traceback

router = APIRouter(prefix="/auth", tags=["auth"])

class StudentSignup(BaseModel):
    name: str
    matric_number: str
    email: str
    department: str

class AdviserSignup(BaseModel):
    name: str
    email: str
    department: str
    level: int

@router.get("/me")
def get_my_profile(user: CurrentUser = Depends(get_current_user)):
    """Resolve the signed-in user's role and profile in one client request."""
    student_res = (
        supabase.table("students")
        .select("id, matric_number, name, email, auth_user_id, department, current_level")
        .eq("auth_user_id", user.id)
        .limit(1)
        .execute()
    )
    if student_res.data:
        profile = student_res.data[0]
        profile["found"] = True
        return {"role": "student", "profile": profile}

    adviser_res = (
        supabase.table("advisers")
        .select("id, name, email, department, level, verified, revoked, auth_user_id")
        .eq("auth_user_id", user.id)
        .limit(1)
        .execute()
    )
    if adviser_res.data:
        profile = adviser_res.data[0]
        profile["found"] = True
        return {"role": "adviser", "profile": profile}

    admin_res = (
        supabase.table("admins")
        .select("id, email, auth_user_id")
        .eq("auth_user_id", user.id)
        .limit(1)
        .execute()
    )
    if admin_res.data:
        profile = admin_res.data[0]
        profile["found"] = True
        return {"role": "admin", "profile": profile}

    return {"role": None, "profile": None}

def check_role_conflict(auth_user_id: str):
    tables = [("student", "students"), ("adviser", "advisers"), ("admin", "admins")]
    for role, table in tables:
        res = supabase.table(table).select("auth_user_id").eq("auth_user_id", auth_user_id).execute()
        if res.data:
            return role
    return None

@router.post("/student-signup")
def student_signup(data: StudentSignup, user: CurrentUser = Depends(get_current_user)):
    try:
        # Cross-role conflict check
        existing_role = check_role_conflict(user.id)
        if existing_role:
            raise HTTPException(status_code=400, detail=f"This account is already registered as a {existing_role}. One account can only have one role.")

        matric = data.matric_number.strip().upper()
        if not user.email or data.email.strip().lower() != user.email.lower():
            raise HTTPException(status_code=403, detail="Signup email must match the authenticated account.")
        
        # Check if student exists
        res = supabase.table("students").select("*").eq("matric_number", matric).execute()
        
        if res.data:
            existing = res.data[0]
            if existing.get("auth_user_id"):
                raise HTTPException(status_code=400, detail="Account already claimed by another user.")
            if not existing.get("email") or existing["email"].strip().lower() != user.email.lower():
                raise HTTPException(status_code=403, detail="The verified account email does not match this student record. Contact an administrator.")
            
            # Update the existing record
            update_data = {
                "email": data.email,
                "auth_user_id": user.id,
                "department": data.department
            }
            # Always update name to what they provided during signup (since they know their own name)
            update_data["name"] = data.name
            
            update_res = supabase.table("students").update(update_data).eq("matric_number", matric).execute()
            
            if not update_res.data:
                raise HTTPException(status_code=500, detail="Failed to claim account.")
            return update_res.data[0]
            
        else:
            raise HTTPException(status_code=403, detail="No imported student record matches this matric number. Contact an administrator.")
            
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        error_msg = str(e)
        if "duplicate key value violates unique constraint" in error_msg:
            if "advisers_email_key" in error_msg:
                raise HTTPException(status_code=400, detail="This email is already registered to another adviser.")
            elif "students_email_key" in error_msg:
                raise HTTPException(status_code=400, detail="This email is already registered to another student.")
            raise HTTPException(status_code=400, detail="This record already exists. Please check your credentials.")
        raise HTTPException(status_code=500, detail="An internal database error occurred. Please try again.")

@router.post("/adviser-signup")
def adviser_signup(data: AdviserSignup, user: CurrentUser = Depends(get_current_user)):
    try:
        # Cross-role conflict check
        existing_role = check_role_conflict(user.id)
        if existing_role:
            raise HTTPException(status_code=400, detail=f"This account is already registered as a {existing_role}. One account can only have one role.")

        if not user.email or data.email.strip().lower() != user.email.lower():
            raise HTTPException(status_code=403, detail="Signup email must match the authenticated account.")

        # Check for conflict: same department and same level, verified=true, revoked=false
        conflict_res = supabase.table("advisers").select("*").eq("department", data.department).eq("level", data.level).eq("verified", True).eq("revoked", False).execute()
        if conflict_res.data:
            raise HTTPException(status_code=400, detail=f"An adviser is already assigned to {data.department} - {data.level} Level. Contact admin if this needs to change.")

        res = supabase.table("advisers").select("*").eq("email", data.email).execute()
        if res.data:
            if res.data[0].get("auth_user_id"):
                raise HTTPException(status_code=400, detail="Email already claimed by another adviser.")
            
            # Update pre-existing adviser record (likely added by admin without auth_user_id)
            update_data = {
                "name": data.name,
                "department": data.department,
                "level": data.level,
                "auth_user_id": user.id,
                # keep verified as false to require admin approval again if they changed departments
                "verified": False
            }
            update_res = supabase.table("advisers").update(update_data).eq("email", data.email).execute()
            
            if not update_res.data:
                raise HTTPException(status_code=500, detail="Failed to claim adviser account.")
            return update_res.data[0]
        else:
            insert_res = supabase.table("advisers").insert({
                "name": data.name,
                "email": data.email,
                "department": data.department,
                "level": data.level,
                "auth_user_id": user.id,
                "verified": False
            }).execute()
            
            if not insert_res.data:
                raise HTTPException(status_code=500, detail="Failed to create adviser.")
            return insert_res.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        error_msg = str(e)
        if "duplicate key value violates unique constraint" in error_msg:
            if "advisers_email_key" in error_msg:
                raise HTTPException(status_code=400, detail="This email is already registered to another adviser.")
            elif "students_email_key" in error_msg:
                raise HTTPException(status_code=400, detail="This email is already registered to another student.")
            raise HTTPException(status_code=400, detail="This record already exists. Please check your credentials.")
        raise HTTPException(status_code=500, detail="An internal database error occurred. Please try again.")

@router.get("/student-profile/{auth_user_id}")
def get_student_profile(auth_user_id: str, user: CurrentUser = Depends(get_current_user)):
    try:
        if auth_user_id != user.id:
            raise HTTPException(status_code=403, detail="You can only access your own profile.")
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
        error_msg = str(e)
        if "duplicate key value violates unique constraint" in error_msg:
            if "advisers_email_key" in error_msg:
                raise HTTPException(status_code=400, detail="This email is already registered to another adviser.")
            elif "students_email_key" in error_msg:
                raise HTTPException(status_code=400, detail="This email is already registered to another student.")
            raise HTTPException(status_code=400, detail="This record already exists. Please check your credentials.")
        raise HTTPException(status_code=500, detail="An internal database error occurred. Please try again.")

@router.get("/adviser-profile/{auth_user_id}")
def get_adviser_profile(auth_user_id: str, user: CurrentUser = Depends(get_current_user)):
    try:
        if auth_user_id != user.id:
            raise HTTPException(status_code=403, detail="You can only access your own profile.")
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
        error_msg = str(e)
        if "duplicate key value violates unique constraint" in error_msg:
            if "advisers_email_key" in error_msg:
                raise HTTPException(status_code=400, detail="This email is already registered to another adviser.")
            elif "students_email_key" in error_msg:
                raise HTTPException(status_code=400, detail="This email is already registered to another student.")
            raise HTTPException(status_code=400, detail="This record already exists. Please check your credentials.")
        raise HTTPException(status_code=500, detail="An internal database error occurred. Please try again.")

