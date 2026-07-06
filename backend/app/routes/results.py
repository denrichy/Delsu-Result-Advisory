from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.db import supabase

router = APIRouter()

class ResultUpdate(BaseModel):
    score: Optional[float] = None
    grade: Optional[str] = None
    units: Optional[int] = None
    course_type: Optional[str] = None

@router.put("/{result_id}")
def update_result(result_id: str, data: ResultUpdate):
    # 1. Fetch current result
    res = supabase.table("results").select("*").eq("id", result_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Result not found")
        
    current_result = res.data[0]
    matric_number = current_result["matric_number"]
    
    # 2. Update the result in the database
    update_data = {}
    if data.score is not None: update_data["score"] = data.score
    if data.grade is not None: update_data["grade"] = data.grade
    if data.units is not None: update_data["units"] = data.units
    if data.course_type is not None: update_data["course_type"] = data.course_type
    
    if update_data:
        upd = supabase.table("results").update(update_data).eq("id", result_id).execute()
        if not upd.data:
            raise HTTPException(status_code=500, detail="Failed to update result")
            
    # Note: If we need to recalculate the student's baseline, we can do it here,
    # but the baseline is stored at the point of ingestion for the *start* of the session.
    # We only update the result here, which will naturally reflect in any dynamic CGPA calculation.
    
    return {"message": "Result updated successfully", "result": update_data}
