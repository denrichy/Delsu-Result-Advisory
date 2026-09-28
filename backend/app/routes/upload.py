import os
import uuid
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from app.security import require_verified_adviser
from typing import List, Optional
from pydantic import BaseModel
from app.ingestion import detect_sheet_format, melt_wide_format, detect_long_format_columns, parse_score_grade
from app.db import supabase
from app.utils.email import send_result_notifications_async
import re

router = APIRouter(tags=["upload"], dependencies=[Depends(require_verified_adviser)])

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
                            "row": None,
                            "description": f"[{matric}] Mathematical Discrepancy: System calculated CGPA as {calc_cgpa} (from {calc_cum_tcp} Total Units), but the Official broadsheet states CGPA is {data['official_cgpa']} (from {data['official_cum_tcp']} Total Units).{cause_str}"
                        })
            
            return {
                "format": "wide",
                "confidence": confidence,
                "total_row_count": len(long_data),
                "preview_rows": long_data[:10],
                "all_rows": long_data,
                "course_metadata": metadata,
                "anomalies": anomalies,
                "stats": {
                    "total_students": len(set(r.get("matric_number") for r in long_data if r.get("matric_number"))),
                    "unique_courses": len(set(r.get("course_code") for r in long_data if r.get("course_code")))
                }
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
                "total_row_count": len(df),
                "anomalies": [],
                "stats": {
                    "total_students": len(set(r.get("matric_number") for r in all_rows if r.get("matric_number"))),
                    "unique_courses": len(set(r.get("course_code") for r in all_rows if r.get("course_code")))
                }
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
async def upload_confirm(request: UploadConfirmRequest, background_tasks: BackgroundTasks, actor=Depends(require_verified_adviser)):
    try:
        courses_created = 0
        students_created = 0
        results_inserted = 0
        
        adviser_id = actor["profile"]["id"]
        adviser_res = supabase.table("advisers").select("level, department").eq("id", adviser_id).execute()
        adviser_level = adviser_res.data[0].get("level") if adviser_res.data else None
        adviser_department = adviser_res.data[0].get("department") if adviser_res.data else None
        
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
            
            # Find the max session already in the database for this adviser's students
            max_session = ""
            if existing_students:
                sample_student_id = list(existing_students.values())[0]["id"]
                res_max = supabase.table("results").select("session").eq("student_id", sample_student_id).execute()
                if res_max.data:
                    sessions = [r["session"] for r in res_max.data if r.get("session")]
                    if sessions:
                        max_session = max(sessions)
            
            is_historical_upload = request.session < max_session if max_session else False
            
            new_students_to_insert = []
            
            students_to_upsert = []
            for matric in unique_matrics:
                if matric in existing_students:
                    existing = existing_students[matric]
                    student_id = existing["id"]
                    student_id_map[matric] = student_id
                    student_email_map[matric] = existing.get("email")
                    
                    update_data = {"id": student_id, "matric_number": matric}
                    needs_update = False
                    
                    if adviser_level is not None and existing.get("current_level") != adviser_level:
                        update_data["current_level"] = adviser_level
                        needs_update = True
                    if adviser_department is not None and not existing.get("department"):
                        update_data["department"] = adviser_department
                        needs_update = True
                        
                    new_name = student_baselines[matric].get("name")
                    if new_name and existing.get("name") != new_name:
                        update_data["name"] = new_name
                        needs_update = True
                        
                    new_baseline_units = student_baselines[matric].get("baseline_units")
                    new_baseline_gps = student_baselines[matric].get("baseline_gps")
                    new_outstanding = student_baselines[matric].get("outstanding_courses")
                    
                    # Prevent historical uploads from overwriting current baselines
                    is_historical = is_historical_upload

                    if not is_historical:
                        if new_baseline_units is not None and existing.get("baseline_units") != new_baseline_units:
                            update_data["baseline_units"] = new_baseline_units
                            needs_update = True
                        if new_baseline_gps is not None and existing.get("baseline_gps") != new_baseline_gps:
                            update_data["baseline_gps"] = new_baseline_gps
                            needs_update = True
                        if new_outstanding is not None and existing.get("outstanding_courses") != new_outstanding:
                            update_data["outstanding_courses"] = new_outstanding
                            needs_update = True
                        
                    if needs_update:
                        students_to_upsert.append(update_data)
                else:
                    insert_data = {
                        "matric_number": matric,
                        "name": student_baselines[matric].get("name"),
                        "current_level": adviser_level if adviser_level else 100,
                        "department": adviser_department,
                        "baseline_units": student_baselines[matric].get("baseline_units"),
                        "baseline_gps": student_baselines[matric].get("baseline_gps"),
                        "outstanding_courses": student_baselines[matric].get("outstanding_courses")
                    }
                    new_students_to_insert.append(insert_data)
            
            # 1. Update existing students in chunks (upsert)
            chunk_size = 50
            for i in range(0, len(students_to_upsert), chunk_size):
                chunk = students_to_upsert[i:i + chunk_size]
                supabase.table("students").upsert(chunk).execute()
                    
            # 2. Insert new students
            if new_students_to_insert:
                for i in range(0, len(new_students_to_insert), chunk_size):
                    chunk = new_students_to_insert[i:i + chunk_size]
                    s_res = supabase.table("students").insert(chunk).execute()
                    if s_res.data:
                        for s in s_res.data:
                            student_id_map[s["matric_number"]] = s["id"]
                        students_created += len(s_res.data)

            # 2.5 Insert/Upsert into Temporal Baseline Table
            temporal_baselines = []
            for matric in unique_matrics:
                student_id = student_id_map.get(matric)
                if not student_id:
                    continue
                base_data = student_baselines.get(matric, {})
                temporal_baselines.append({
                    "student_id": student_id,
                    "session": request.session,
                    "semester": request.semester,
                    "baseline_units": base_data.get("baseline_units", 0),
                    "baseline_gps": base_data.get("baseline_gps", 0.0),
                    "outstanding_courses": base_data.get("outstanding_courses", "")
                })
            
            if temporal_baselines:
                for i in range(0, len(temporal_baselines), chunk_size):
                    chunk = temporal_baselines[i:i + chunk_size]
                    try:
                        supabase.table("student_session_baselines").upsert(
                            chunk, on_conflict="student_id, session, semester"
                        ).execute()
                    except Exception as e:
                        print("Warning: temporal baseline upsert failed", e)

        # 3. Create Upload Record
        upload_data = {
            "adviser_id": adviser_id,
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
                    "uploaded_by": adviser_id,
                    "upload_id": upload_id
                })
                
        if results_data:
            chunk_size = 500
            for i in range(0, len(results_data), chunk_size):
                chunk = results_data[i:i + chunk_size]
                r_res = supabase.table("results").insert(chunk).execute()
                if r_res.data:
                    results_inserted += len(r_res.data)
                
        # 5. Dispatch notifications to affected students
        notification_data = []
        student_emails_for_brevo = []
        
        for matric, student_id in student_id_map.items():
            # For DB notifications
            notification_data.append({
                "student_id": student_id,
                "message": f"New results have been published for {request.semester} - {request.session}."
            })
            
            # For Email notifications
            email = student_email_map.get(matric)
            if email:
                student_emails_for_brevo.append({
                    "email": email,
                    "matric": matric
                })
                
        # Insert DB notifications
        if notification_data:
            supabase.table("notifications").insert(notification_data).execute()
            
        # Dispatch emails in background
        if student_emails_for_brevo:
            background_tasks.add_task(
                send_result_notifications_async,
                student_emails_for_brevo,
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


def background_cleanup_orphans(student_ids: list, upload_terms: set = None):
    try:
        from app.db import supabase
        from app.analytics import parse_term
        
        if not student_ids:
            return
            
        chunk_size = 50
        
        # 1. Delete temporal baselines associated with the deleted terms
        if upload_terms:
            for session, semester in upload_terms:
                for i in range(0, len(student_ids), chunk_size):
                    chunk = student_ids[i:i+chunk_size]
                    supabase.table("student_session_baselines")\
                        .delete()\
                        .in_("student_id", chunk)\
                        .eq("session", session)\
                        .eq("semester", semester)\
                        .execute()
                        
        # 2. Recalculate baseline values for all affected students
        for i in range(0, len(student_ids), chunk_size):
            chunk = student_ids[i:i+chunk_size]
            
            res_results = supabase.table("results").select("student_id").in_("student_id", chunk).execute()
            has_results = set(r["student_id"] for r in res_results.data) if res_results.data else set()
            
            res_baselines = supabase.table("student_session_baselines").select("*").in_("student_id", chunk).execute()
            baselines_by_student = {}
            if res_baselines.data:
                for b in res_baselines.data:
                    sid = b["student_id"]
                    if sid not in baselines_by_student:
                        baselines_by_student[sid] = []
                    baselines_by_student[sid].append(b)
                    
            updates = []
            for sid in chunk:
                if sid not in has_results and sid not in baselines_by_student:
                    updates.append({
                        "id": sid,
                        "baseline_units": 0,
                        "baseline_gps": 0.0,
                        "outstanding_courses": ""
                    })
                else:
                    latest_baseline = None
                    if sid in baselines_by_student:
                        student_bls = baselines_by_student[sid]
                        latest_baseline = max(
                            student_bls,
                            key=lambda item: parse_term(item.get('session', ''), item.get('semester', '')),
                            default=None
                        )
                        
                    updates.append({
                        "id": sid,
                        "baseline_units": latest_baseline.get("baseline_units", 0) if latest_baseline else 0,
                        "baseline_gps": latest_baseline.get("baseline_gps", 0.0) if latest_baseline else 0.0,
                        "outstanding_courses": latest_baseline.get("outstanding_courses", "") if latest_baseline else ""
                    })
                    
            if updates:
                supabase.table("students").upsert(updates).execute()
                
    except Exception as e:
        print(f"Background orphan cleanup failed: {e}")

@router.delete("/{upload_id}")
async def delete_upload(upload_id: str, background_tasks: BackgroundTasks, actor=Depends(require_verified_adviser)):
    try:
        _require_owned_upload(upload_id, actor["profile"]["id"])
        # Get all student IDs and session/semester info before deleting
        res_students = supabase.table("results").select("student_id, session, semester").eq("upload_id", upload_id).execute()
        student_ids = list(set([r["student_id"] for r in res_students.data])) if res_students.data else []
        # Collect distinct session/semester combos from this upload's results
        upload_terms = set()
        if res_students.data:
            for r in res_students.data:
                s, sem = r.get("session"), r.get("semester")
                if s and sem:
                    upload_terms.add((s, sem))

        # First, check how many results are associated so we can report back
        res_count = supabase.table("results").select("*", count="exact").eq("upload_id", upload_id).execute()
        results_deleted = res_count.count if res_count and hasattr(res_count, 'count') and res_count.count is not None else 0

        # Delete from uploads (Supabase will ON DELETE CASCADE results)
        d_res = supabase.table("uploads").delete().eq("id", upload_id).execute()
        if not d_res.data:
            raise HTTPException(status_code=404, detail="Upload not found or already deleted")
            
        # Fire background task instead of waiting for cleanup
        if student_ids:
            background_tasks.add_task(background_cleanup_orphans, student_ids, upload_terms)
            
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
async def get_upload_history(adviser_id: str, actor=Depends(require_verified_adviser)):
    try:
        if adviser_id != actor["profile"]["id"]:
            raise HTTPException(status_code=403, detail="You can only access your own upload history")
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch upload history: {str(e)}")

@router.get("/{upload_id}/results")
async def get_upload_results(upload_id: str, actor=Depends(require_verified_adviser)):
    _require_owned_upload(upload_id, actor["profile"]["id"])
    res = supabase.table("results").select("*, students(name)").eq("upload_id", upload_id).execute()
    if not res.data:
        return []
    
    cleaned = []
    for r in res.data:
        r["student_name"] = r["students"]["name"] if r.get("students") else None
        del r["students"]
        cleaned.append(r)
        
    return cleaned


def _require_owned_upload(upload_id: str, adviser_id: str):
    result = (
        supabase.table("uploads")
        .select("id")
        .eq("id", upload_id)
        .eq("adviser_id", adviser_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Upload not found")
