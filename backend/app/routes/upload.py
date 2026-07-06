import os
import uuid
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
from app.ingestion import detect_sheet_format, melt_wide_format, detect_long_format_columns, parse_score_grade
from app.db import supabase
from app.utils.email import send_result_notifications_async
import re

router = APIRouter(tags=["upload"])

class ResultRow(BaseModel):
    matric_number: Optional[str] = None
    name: Optional[str] = None
    sex: Optional[str] = None
    course_code: Optional[str] = None
    score: Optional[float] = None
    grade: Optional[str] = None
    units: Optional[int] = None
    course_type: Optional[str] = None
    baseline_units: Optional[int] = 0
    baseline_gps: Optional[float] = 0.0
    outstanding_courses: Optional[str] = None
    official_curr_tcp: Optional[float] = None
    official_curr_tgp: Optional[float] = None
    official_cum_tcp: Optional[float] = None
    official_cum_tgp: Optional[float] = None
    official_cgpa: Optional[float] = None

class UploadConfirmRequest(BaseModel):
    rows: List[ResultRow]
    semester: str
    session: str
    adviser_id: str
    filename: str

TMP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "tmp"))
os.makedirs(TMP_DIR, exist_ok=True)

def calculate_gpa(score):
    if score is None: return 0.0
    if score >= 70: return 5.0
    elif score >= 60: return 4.0
    elif score >= 50: return 3.0
    elif score >= 45: return 2.0
    else: return 0.0

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
            course_row_idx = detect_res.get("course_row_idx", 0)
            long_data, metadata = melt_wide_format(temp_filepath, course_cols, course_row_idx)
            
            # Run Anomaly Scan
            anomalies = []
            student_courses = {}
            for row in long_data:
                matric = row["matric_number"]
                if matric not in student_courses:
                    student_courses[matric] = {
                        "baseline_units": row["baseline_units"],
                        "baseline_gps": row["baseline_gps"],
                        "official_cum_tcp": row.get("official_cum_tcp"),
                        "official_cum_tgp": row.get("official_cum_tgp"),
                        "official_cgpa": row.get("official_cgpa"),
                        "calculated_curr_tcp": 0,
                        "calculated_curr_tgp": 0.0
                    }
                units = row["units"] or 0
                score = row["score"]
                gp = calculate_gpa(score)
                student_courses[matric]["calculated_curr_tcp"] += units
                student_courses[matric]["calculated_curr_tgp"] += (gp * units)
                
            for matric, data in student_courses.items():
                if data["official_cum_tcp"] is not None and data["official_cgpa"] is not None:
                    calc_cum_tcp = data["baseline_units"] + data["calculated_curr_tcp"]
                    calc_cum_tgp = data["baseline_gps"] + data["calculated_curr_tgp"]
                    calc_cgpa = round(calc_cum_tgp / calc_cum_tcp, 2) if calc_cum_tcp > 0 else 0.0
                    
                    if abs(calc_cgpa - data["official_cgpa"]) > 0.02 or calc_cum_tcp != data["official_cum_tcp"]:
                        diff_units = calc_cum_tcp - data["official_cum_tcp"]
                        cause_str = ""
                        if diff_units > 0:
                            cause_str = f" ➔ Cause: The system counted {int(diff_units)} extra units that aren't on the official totals."
                        elif diff_units < 0:
                            cause_str = f" ➔ Cause: The official totals include {int(abs(diff_units))} extra units not found in this upload's calculations."
                        else:
                            if data.get("official_cum_tgp"):
                                diff_tgp = calc_cum_tgp - data["official_cum_tgp"]
                                if abs(diff_tgp) > 0.1:
                                    cause_str = f" ➔ Cause: Units match, but there's a difference of {round(abs(diff_tgp), 1)} Total Grade Points."
                                else:
                                    cause_str = " ➔ Cause: Total Units and Grade Points match. This is likely a rounding discrepancy."
                            else:
                                cause_str = " ➔ Cause: Total Units match, but the calculated CGPA differs. Check individual grades."
                                
                        anomalies.append({
                            "matric_number": matric,
                            "issue": f"Mathematical Discrepancy",
                            "details": f"System calculated CGPA as {calc_cgpa} (from {calc_cum_tcp} Total Units), but the Official broadsheet states CGPA is {data['official_cgpa']} (from {data['official_cum_tcp']} Total Units).{cause_str}"
                        })
            
            return {
                "format": "wide",
                "confidence": confidence,
                "total_row_count": len(long_data),
                "preview_rows": long_data[:10],
                "all_rows": long_data,
                "course_metadata": metadata,
                "anomalies": anomalies
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
                        
                units = None
                if mapping.get("units") and pd.notna(row[mapping["units"]]):
                    try:
                        units = int(float(row[mapping["units"]]))
                    except:
                        pass
                        
                c_type = None
                if mapping.get("course_type") and pd.notna(row[mapping["course_type"]]):
                    c_type = str(row[mapping["course_type"]]).strip()
                        
                all_rows.append({
                    "matric_number": matric,
                    "course_code": course,
                    "score": score,
                    "grade": grade,
                    "units": units,
                    "course_type": c_type
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
async def upload_confirm(request: UploadConfirmRequest, background_tasks: BackgroundTasks):
    try:
        courses_created = 0
        students_created = 0
        results_inserted = 0
        
        adviser_res = supabase.table("advisers").select("level").eq("id", request.adviser_id).execute()
        adviser_level = adviser_res.data[0].get("level") if adviser_res.data else None
        
        # 1. Process Courses
        course_id_map = {}
        unique_courses = {}
        for r in request.rows:
            if r.course_code:
                unique_courses[r.course_code] = r
                
        if unique_courses:
            res = supabase.table("courses").select("id, course_code, units, course_type").in_("course_code", list(unique_courses.keys())).execute()
            existing_courses = {c["course_code"]: c for c in res.data} if res.data else {}
            
            new_courses_to_insert = []
            
            for code, row in unique_courses.items():
                c_type = row.course_type
                if c_type:
                    c_type_upper = str(c_type).upper()
                    if c_type_upper == "C":
                        c_type = "core"
                    elif c_type_upper == "E":
                        c_type = "elective"
                    else:
                        c_type = str(c_type).lower()
                
                if code in existing_courses:
                    existing_course = existing_courses[code]
                    course_id_map[code] = existing_course["id"]
                    
                    needs_update = False
                    update_data = {}
                    if existing_course.get("units") is None and row.units is not None:
                        update_data["units"] = row.units
                        needs_update = True
                    if existing_course.get("course_type") is None and c_type is not None:
                        update_data["course_type"] = c_type
                        needs_update = True
                        
                    if needs_update:
                        supabase.table("courses").update(update_data).eq("id", existing_course["id"]).execute()
                else:
                    level = None
                    match = re.search(r'\d', code)
                    if match:
                        level = int(match.group(0)) * 100
                    
                    new_courses_to_insert.append({
                        "course_code": code,
                        "units": row.units,
                        "course_type": c_type,
                        "level": level
                    })
                    
            if new_courses_to_insert:
                c_res = supabase.table("courses").insert(new_courses_to_insert).execute()
                if c_res.data:
                    for c in c_res.data:
                        course_id_map[c["course_code"]] = c["id"]
                    courses_created += len(c_res.data)
                    
        # 2. Process Students
        student_id_map = {}
        student_email_map = {}
        
        student_baselines = {}
        for r in request.rows:
            if r.matric_number:
                if r.matric_number not in student_baselines:
                    student_baselines[r.matric_number] = {
                        "name": r.name,
                        "baseline_units": r.baseline_units or 0,
                        "baseline_gps": r.baseline_gps or 0.0,
                        "outstanding_courses": r.outstanding_courses or ""
                    }
                    
        unique_matrics = list(student_baselines.keys())
        
        if unique_matrics:
            res = supabase.table("students").select("id, email, matric_number, name, current_level, baseline_units, baseline_gps, outstanding_courses").in_("matric_number", unique_matrics).execute()
            existing_students = {s["matric_number"]: s for s in res.data} if res.data else {}
            
            new_students_to_insert = []
            
            for matric in unique_matrics:
                if matric in existing_students:
                    existing = existing_students[matric]
                    student_id = existing["id"]
                    student_id_map[matric] = student_id
                    student_email_map[matric] = existing.get("email")
                    
                    update_data = {}
                    if adviser_level is not None and existing.get("current_level") != adviser_level:
                        update_data["current_level"] = adviser_level
                        
                    new_name = student_baselines[matric].get("name")
                    if new_name and existing.get("name") != new_name:
                        update_data["name"] = new_name
                        
                    # Always update baselines to the latest broadsheet values
                    new_baseline_units = student_baselines[matric].get("baseline_units")
                    new_baseline_gps = student_baselines[matric].get("baseline_gps")
                    new_outstanding = student_baselines[matric].get("outstanding_courses")
                    if new_baseline_units is not None and existing.get("baseline_units") != new_baseline_units:
                        update_data["baseline_units"] = new_baseline_units
                    if new_baseline_gps is not None and existing.get("baseline_gps") != new_baseline_gps:
                        update_data["baseline_gps"] = new_baseline_gps
                    if new_outstanding is not None and existing.get("outstanding_courses") != new_outstanding:
                        update_data["outstanding_courses"] = new_outstanding
                        
                    if update_data:
                        supabase.table("students").update(update_data).eq("id", student_id).execute()
                else:
                    insert_data = {
                        "matric_number": matric,
                        "name": student_baselines[matric].get("name"),
                        "password_hash": get_password_hash("password123"), # default password
                        "current_level": adviser_level if adviser_level else 100,
                        "baseline_units": student_baselines[matric].get("baseline_units"),
                        "baseline_gps": student_baselines[matric].get("baseline_gps"),
                        "outstanding_courses": student_baselines[matric].get("outstanding_courses")
                    }
                    new_students_to_insert.append(insert_data)
                    
            if new_students_to_insert:
                s_res = supabase.table("students").insert(new_students_to_insert).execute()
                if s_res.data:
                    for s in s_res.data:
                        student_id_map[s["matric_number"]] = s["id"]
                    students_created += len(s_res.data)

        # 3. Create Upload Record
        upload_data = {
            "adviser_id": request.adviser_id,
            "filename": request.filename,
            "status": "published",
            "raw_row_count": len(request.rows)
        }
        u_res = supabase.table("uploads").insert(upload_data).execute()
        upload_id = u_res.data[0]["id"] if u_res.data else None

        # 4. Insert Results
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
                    "uploaded_by": request.adviser_id,
                    "upload_id": upload_id
                })
                
        if results_data:
            r_res = supabase.table("results").insert(results_data).execute()
            if r_res.data:
                results_inserted = len(r_res.data)
                
        # 5. Dispatch notifications to affected students
        notification_data = []
        student_emails_for_resend = []
        
        for matric, student_id in student_id_map.items():
            # For DB notifications
            notification_data.append({
                "student_id": student_id,
                "message": f"New results have been published for {request.semester} - {request.session}."
            })
            
            # For Email notifications
            email = student_email_map.get(matric)
            if email:
                student_emails_for_resend.append({
                    "email": email,
                    "matric": matric
                })
                
        # Insert DB notifications
        if notification_data:
            supabase.table("notifications").insert(notification_data).execute()
            
        # Dispatch emails in background
        if student_emails_for_resend:
            background_tasks.add_task(
                send_result_notifications_async,
                student_emails_for_resend,
                request.semester,
                request.session
            )
        
        return {
            "students_created": students_created,
            "courses_created": courses_created,
            "results_inserted": results_inserted,
            "upload_id": upload_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload confirm failed: {str(e)}")

def clean_all_phantoms():
    try:
        res = supabase.table("students").select("id, baseline_units").execute()
        if not res.data: return
        phantom_ids = []
        for s in res.data:
            if s.get("baseline_units", 0) > 0:
                r_res = supabase.table("results").select("id").eq("student_id", s["id"]).limit(1).execute()
                if not r_res.data:
                    phantom_ids.append(s["id"])
        
        batch_size = 50
        for i in range(0, len(phantom_ids), batch_size):
            batch = phantom_ids[i:i+batch_size]
            supabase.table("students").update({
                "baseline_units": 0,
                "baseline_gps": 0.0,
                "outstanding_courses": ""
            }).in_("id", batch).execute()
    except Exception as e:
        print(f"Background phantom cleanup failed: {e}")

@router.delete("/{upload_id}")
async def delete_upload(upload_id: str, background_tasks: BackgroundTasks):
    try:
        # Get all student IDs associated with this upload before deleting
        res_students = supabase.table("results").select("student_id").eq("upload_id", upload_id).execute()
        student_ids = list(set([r["student_id"] for r in res_students.data])) if res_students.data else []

        # First, check how many results are associated so we can report back
        res_count = supabase.table("results").select("*", count="exact").eq("upload_id", upload_id).execute()
        results_deleted = res_count.count if res_count and hasattr(res_count, 'count') and res_count.count is not None else 0

        # Delete from uploads (Supabase will ON DELETE CASCADE results)
        d_res = supabase.table("uploads").delete().eq("id", upload_id).execute()
        if not d_res.data:
            raise HTTPException(status_code=404, detail="Upload not found or already deleted")
            
        # Clean up baseline data for students who no longer have any results
        for sid in student_ids:
            remain_res = supabase.table("results").select("id").eq("student_id", sid).limit(1).execute()
            if not remain_res.data:
                # No more results for this student, wipe their baselines
                supabase.table("students").update({
                    "baseline_units": 0,
                    "baseline_gps": 0.0,
                    "outstanding_courses": ""
                }).eq("id", sid).execute()
                
        # Trigger background sweeping of any straggler phantom students
        background_tasks.add_task(clean_all_phantoms)
            
        return {
            "success": True,
            "message": "Upload deleted successfully",
            "results_deleted": results_deleted
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete upload: {str(e)}")

@router.get("/history/{adviser_id}")
async def get_upload_history(adviser_id: str):
    try:
        # Get all uploads for this adviser
        uploads_res = supabase.table("uploads").select("*").eq("adviser_id", adviser_id).order("created_at", desc=True).execute()
        
        if not uploads_res.data:
            return []
            
        history = []
        for upload in uploads_res.data:
            upload_id = upload["id"]
            # Fetch semester/session from one of its results
            results_res = supabase.table("results").select("semester, session").eq("upload_id", upload_id).limit(1).execute()
            
            semester = None
            session = None
            if results_res.data:
                semester = results_res.data[0].get("semester")
                session = results_res.data[0].get("session")
                
            history.append({
                "id": upload_id,
                "filename": upload.get("filename"),
                "semester": semester,
                "session": session,
                "raw_row_count": upload.get("raw_row_count"),
                "created_at": upload.get("created_at")
            })
            
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch upload history: {str(e)}")

@router.get("/{upload_id}/results")
async def get_upload_results(upload_id: str):
    res = supabase.table("results").select("*, students(name)").eq("upload_id", upload_id).execute()
    if not res.data:
        return []
    
    cleaned = []
    for r in res.data:
        r["student_name"] = r["students"]["name"] if r.get("students") else None
        del r["students"]
        cleaned.append(r)
        
    return cleaned
