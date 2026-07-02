import os
import uuid
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.ingestion import detect_sheet_format, melt_wide_format

router = APIRouter(prefix="/upload-preview", tags=["upload"])

TMP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "tmp"))
os.makedirs(TMP_DIR, exist_ok=True)

@router.post("")
async def upload_preview(file: UploadFile = File(...)):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")
        
    file_id = str(uuid.uuid4())
    temp_filepath = os.path.join(TMP_DIR, f"{file_id}_{file.filename}")
    
    try:
        content = await file.read()
        with open(temp_filepath, "wb") as f:
            f.write(content)
            
        detect_res = detect_sheet_format(temp_filepath)
        fmt = detect_res.get("format", "unknown")
        confidence = detect_res.get("confidence", 0.0)
        course_cols = detect_res.get("detected_course_columns", [])
        
        if fmt == "wide":
            long_data, metadata = melt_wide_format(temp_filepath, course_cols)
            return {
                "format": "wide",
                "confidence": confidence,
                "total_row_count": len(long_data),
                "preview_rows": long_data[:10],
                "course_metadata": metadata
            }
        elif fmt == "long":
            df = pd.read_excel(temp_filepath, nrows=5)
            df = df.fillna("")
            raw_preview = df.to_dict(orient="records")
            
            return {
                "format": "long",
                "confidence": confidence,
                "message": "long format detected, column-mapping not yet implemented",
                "raw_preview": raw_preview
            }
        else:
            return {
                "format": "unknown",
                "confidence": confidence,
                "message": "Unable to detect sheet format"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)
