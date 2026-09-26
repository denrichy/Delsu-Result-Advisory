from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException

from app.db import supabase_admin


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None
    access_token: str


def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    try:
        response = supabase_admin.auth.get_user(token)
        user = response.user
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired access token") from exc

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")

    return CurrentUser(id=str(user.id), email=user.email, access_token=token)


def _profile(table: str, user_id: str):
    result = (
        supabase_admin.table(table)
        .select("*")
        .eq("auth_user_id", user_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def require_admin(user: CurrentUser = Depends(get_current_user)):
    profile = _profile("admins", user.id)
    if not profile:
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"user": user, "profile": profile}


def require_verified_adviser(user: CurrentUser = Depends(get_current_user)):
    profile = _profile("advisers", user.id)
    if not profile or not profile.get("verified") or profile.get("revoked"):
        raise HTTPException(status_code=403, detail="Verified adviser access required")
    return {"user": user, "profile": profile}


def require_matching_adviser_header(
    auth_user_id: str | None = Header(default=None),
    actor=Depends(require_verified_adviser),
):
    # Kept temporarily for compatibility with the existing analytics client.
    # The value is never trusted as identity; it must match the verified JWT.
    if not auth_user_id or auth_user_id != actor["user"].id:
        raise HTTPException(status_code=403, detail="Authenticated adviser identity mismatch")
    return actor


def require_student(user: CurrentUser = Depends(get_current_user)):
    profile = _profile("students", user.id)
    if not profile:
        raise HTTPException(status_code=403, detail="Student access required")
    return {"user": user, "profile": profile}


def require_student_or_adviser(user: CurrentUser = Depends(get_current_user)):
    student = _profile("students", user.id)
    if student:
        return {"user": user, "role": "student", "profile": student}

    adviser = _profile("advisers", user.id)
    if adviser and adviser.get("verified") and not adviser.get("revoked"):
        return {"user": user, "role": "adviser", "profile": adviser}

    raise HTTPException(status_code=403, detail="Student or verified adviser access required")
