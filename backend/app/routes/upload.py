import os
import uuid
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.ingestion import detect_sheet_format, melt_wide_format, detect_long_format_columns, parse_score_grade

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
            header_idx = detect_res.get("header_idx", 0)
            df = pd.read_excel(temp_filepath, header=header_idx)
            
            mapping = detect_long_format_columns(df)
            
            preview_rows = []
            for _, row in df.head(10).iterrows():
                matric = str(row[mapping["matric_number"]]) if mapping["matric_number"] and pd.notna(row[mapping["matric_number"]]) else None
                course = str(row[mapping["course_code"]]) if mapping["course_code"] and pd.notna(row[mapping["course_code"]]) else None
                
                score = None
                grade = None
                
                if mapping.get("score_type") == "split":
                    ca_col = mapping.get("ca_column")
                    exam_col = mapping.get("exam_column")
                    ca_val = row[ca_col] if ca_col and pd.notna(row[ca_col]) else 0
                    exam_val = row[exam_col] if exam_col and pd.notna(row[exam_col]) else 0
                    try:
                        score = int(float(ca_val)) + int(float(exam_val))
                    except (ValueError, TypeError):
                        score = None
                else:
                    if mapping.get("score"):
                        cell_val = row[mapping["score"]]
                        if mapping.get("score_needs_parsing"):
                            parsed = parse_score_grade(cell_val)
                            if parsed:
                                score = parsed["score"]
                                grade = parsed["grade"]
                        else:
                            parsed = parse_score_grade(cell_val)
                            if parsed:
                                score = parsed["score"]
                            
                if mapping["grade"] and grade is None:
                    g_val = row[mapping["grade"]]
                    if pd.notna(g_val):
                        grade = str(g_val).strip().upper()
                        
                preview_rows.append({
                    "matric_number": matric,
                    "course_code": course,
                    "score": score,
                    "grade": grade
                })
            
            return {
                "format": "long",
                "confidence": confidence,
                "mapping": mapping,
                "preview_rows": preview_rows,
                "total_row_count": len(df)
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
