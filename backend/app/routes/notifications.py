from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import supabase
import traceback

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/student/{student_id}")
def get_notifications(student_id: str):
    try:
        # Fetch notifications for this student
        notif_res = supabase.table("notifications").select("*").eq("student_id", student_id).order("created_at", desc=True).execute()
        return notif_res.data
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{notification_id}/read")
def mark_notification_read(notification_id: str):
    try:
        # Mark as read
        res = supabase.table("notifications").update({"read": True}).eq("id", notification_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Notification not found")
            
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
