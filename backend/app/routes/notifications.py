from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import supabase

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class NotificationSendRequest(BaseModel):
    student_matric_number: str
    message: str

@router.post("/send")
def send_notification(req: NotificationSendRequest):
    # Lookup student id
    res = supabase.table("students").select("id").eq("matric_number", req.student_matric_number.upper()).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Student not found")
        
    student_id = res.data[0]["id"]
    
    # Insert notification
    insert_res = supabase.table("notifications").insert({
        "student_id": student_id,
        "message": req.message
    }).execute()
    
    if not insert_res.data:
        raise HTTPException(status_code=500, detail="Failed to create notification")
        
    return insert_res.data[0]

@router.get("/{matric_number:path}")
def get_notifications(matric_number: str):
    # Lookup student id
    res = supabase.table("students").select("id").eq("matric_number", matric_number.upper()).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Student not found")
        
    student_id = res.data[0]["id"]
    
    # Fetch notifications
    notif_res = supabase.table("notifications").select("*").eq("student_id", student_id).order("created_at", desc=True).execute()
    return notif_res.data

@router.patch("/{notification_id}/read")
def mark_notification_read(notification_id: str):
    # Mark as read
    res = supabase.table("notifications").update({"read": True}).eq("id", notification_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    return res.data[0]
