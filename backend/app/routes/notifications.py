from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.db import supabase
from app.security import require_student
import traceback

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/student/{student_id}")
def get_notifications(student_id: str, actor=Depends(require_student)):
    try:
        if student_id != actor["profile"]["id"]:
            raise HTTPException(status_code=403, detail="You can only access your own notifications")
        # Fetch notifications for this student
        notif_res = supabase.table("notifications").select("*").eq("student_id", student_id).order("created_at", desc=True).execute()
        return notif_res.data
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{notification_id}/read")
def mark_notification_read(notification_id: str, actor=Depends(require_student)):
    try:
        # Mark as read
        res = supabase.table("notifications").update({"read": True}).eq("id", notification_id).eq("student_id", actor["profile"]["id"]).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Notification not found")
            
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/student/{student_id}/read-all")
def mark_all_notifications_read(student_id: str, actor=Depends(require_student)):
    try:
        if student_id != actor["profile"]["id"]:
            raise HTTPException(status_code=403, detail="You can only update your own notifications")
        # Mark all unread notifications for this student as read
        res = supabase.table("notifications").update({"read": True}).eq("student_id", student_id).eq("read", False).execute()
        return {"message": "All marked as read", "count": len(res.data) if res.data else 0}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
