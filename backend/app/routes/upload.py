import os
import uuid
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.ingestion import detect_sheet_format, melt_wide_format, detect_long_format_columns, parse_score_grade
from app.db import supabase

router = APIRouter(tags=["upload"])

class ResultRow(BaseModel):
    matric_number: Optional[str] = None
    course_code: Optional[str] = None
    score: Optional[float] = None
    grade: Optional[str] = None
    units: Optional[int] = None
    course_type: Optional[str] = None

class UploadConfirmRequest(BaseModel):
    rows: List[ResultRow]
    semester: str
    session: str
    adviser_id: str
    filename: str

TMP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "tmp"))
os.makedirs(TMP_DIR, exist_ok=True)

@router.post("/preview")
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
                "all_rows": long_data,
                "course_metadata": metadata
            }
        elif fmt == "long":
            header_idx = detect_res.get("header_idx", 0)
            df = pd.read_excel(temp_filepath, header=header_idx)
            
            mapping = detect_long_format_columns(df)
            
            all_rows = []
            for _, row in df.iterrows():
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
                        
                all_rows.append({
                    "matric_number": matric,
                    "course_code": course,
                    "score": score,
                    "grade": grade
                })
            
            return {
                "format": "long",
                "confidence": confidence,
                "mapping": mapping,
                "preview_rows": all_rows[:10],
                "all_rows": all_rows,
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

@router.post("/confirm")
async def upload_confirm(request: UploadConfirmRequest):
    try:
        courses_created = 0
        students_created = 0
        results_inserted = 0
        
        # 1. Process Courses
        course_id_map = {}
        unique_courses = {}
        for r in request.rows:
            if r.course_code:
                unique_courses[r.course_code] = r
                
        for code, row in unique_courses.items():
            res = supabase.table("courses").select("id").eq("course_code", code).execute()
            if res.data:
                course_id_map[code] = res.data[0]["id"]
            else:
                c_type = row.course_type
                if c_type:
                    c_type_upper = str(c_type).upper()
                    if c_type_upper == "C":
                        c_type = "core"
                    elif c_type_upper == "E":
                        c_type = "elective"
                    else:
                        c_type = str(c_type).lower()
                
                insert_data = {
                    "course_code": code,
                    "units": row.units,
                    "course_type": c_type
                }
                c_res = supabase.table("courses").insert(insert_data).execute()
                if c_res.data:
                    course_id_map[code] = c_res.data[0]["id"]
                    courses_created += 1
                    
        # 2. Process Students
        student_id_map = {}
        unique_matrics = set(r.matric_number for r in request.rows if r.matric_number)
        
        for matric in unique_matrics:
            res = supabase.table("students").select("id").eq("matric_number", matric).execute()
            if res.data:
                student_id_map[matric] = res.data[0]["id"]
            else:
                insert_data = {
                    "matric_number": matric
                }
                s_res = supabase.table("students").insert(insert_data).execute()
                if s_res.data:
                    student_id_map[matric] = s_res.data[0]["id"]
                    students_created += 1

        # 3. Insert Results
        results_data = []
        for row in request.rows:
            if not row.matric_number or not row.course_code:
                continue
                
            student_id = student_id_map.get(row.matric_number)
            course_id = course_id_map.get(row.course_code)
            
            if student_id and course_id:
                results_data.append({
                    "student_id": student_id,
                    "course_id": course_id,
                    "score": row.score,
                    "grade": row.grade,
                    "semester": request.semester,
                    "session": request.session,
                    "uploaded_by": request.adviser_id
                })
                
        if results_data:
            r_res = supabase.table("results").insert(results_data).execute()
            if r_res.data:
                results_inserted = len(r_res.data)
                
        # 4. Create Upload Record
        upload_data = {
            "adviser_id": request.adviser_id,
            "filename": request.filename,
            "status": "published",
            "raw_row_count": len(request.rows)
        }
        u_res = supabase.table("uploads").insert(upload_data).execute()
        upload_id = u_res.data[0]["id"] if u_res.data else None
        
        return {
            "students_created": students_created,
            "courses_created": courses_created,
            "results_inserted": results_inserted,
            "upload_id": upload_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload confirm failed: {str(e)}")
