from app.db import supabase
from app.performance import calculate_gpa
from collections import defaultdict

def _get_bulk_student_data(level: int = None):
    # Fetch students
    query = supabase.table('students').select('id, matric_number, current_level, baseline_units, baseline_gps, auth_user_id')
    if level:
        query = query.eq('current_level', level)
    students_res = query.execute()
    
    if not students_res.data:
        return []
        
    students_data = students_res.data
    
    # We chunk the student_ids in case there are many, to avoid URL length limits in 'in_'
    all_results = []
    chunk_size = 100
    student_ids = [s['id'] for s in students_data]
    
    for i in range(0, len(student_ids), chunk_size):
        chunk = student_ids[i:i + chunk_size]
        res = supabase.table("results").select("student_id, score, grade, semester, session, courses(course_code, course_title, units, course_type, level)").in_("student_id", chunk).execute()
        if res.data:
            all_results.extend(res.data)
            
    # Group by matric_number
    id_to_matric = {s['id']: s['matric_number'] for s in students_data}
    matric_to_baseline = {s['matric_number']: {"units": s.get("baseline_units") or 0, "gps": s.get("baseline_gps") or 0.0, "auth_user_id": s.get("auth_user_id")} for s in students_data}
    
    results_by_matric = defaultdict(list)
    for r in all_results:
        matric = id_to_matric.get(r['student_id'])
        if not matric: continue
        
        course = r.get("courses", {})
        results_by_matric[matric].append({
            "course_code": course.get("course_code"),
            "title": course.get("course_title"),
            "level": course.get("level"),
            "units": course.get("units"),
            "course_type": course.get("course_type"),
            "score": r.get("score"),
            "grade": r.get("grade"),
            "semester": r.get("semester"),
            "session": r.get("session")
        })
        
    profiles = []
    for matric, baseline_data in matric_to_baseline.items():
        results = results_by_matric.get(matric, [])
        profiles.append({
            "matric_number": matric,
            "baseline_units": baseline_data["units"],
            "baseline_gps": baseline_data["gps"],
            "auth_user_id": baseline_data["auth_user_id"],
            "results": results
        })
            
    return profiles

def get_class_average(course_code: str):
    normalized = course_code.replace(" ", "").upper()
    course_res = supabase.table('courses').select('id, course_code').execute()
    course_ids = [c['id'] for c in course_res.data if c.get("course_code", "").replace(" ", "").upper() == normalized]
    
    if not course_ids:
        return None
    
    # Chunk course_ids to avoid URL length issues just in case, though usually few
    scores = []
    chunk_size = 50
    for i in range(0, len(course_ids), chunk_size):
        chunk = course_ids[i:i + chunk_size]
        results_res = supabase.table('results').select('score').in_('course_id', chunk).execute()
        if results_res.data:
            scores.extend([r['score'] for r in results_res.data if r.get('score') is not None])
    
    if not scores:
        return 0.0
        
    return round(sum(scores) / len(scores), 2)

def get_grade_distribution(course_code: str):
    normalized = course_code.replace(" ", "").upper()
    course_res = supabase.table('courses').select('id, course_code').execute()
    course_ids = [c['id'] for c in course_res.data if c.get("course_code", "").replace(" ", "").upper() == normalized]
    
    distribution = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    
    if not course_ids:
        return distribution
        
    chunk_size = 50
    for i in range(0, len(course_ids), chunk_size):
        chunk = course_ids[i:i + chunk_size]
        results_res = supabase.table('results').select('grade').in_('course_id', chunk).execute()
        if results_res.data:
            for r in results_res.data:
                grade = r.get('grade')
                if grade in distribution:
                    distribution[grade] += 1
            
    return distribution

def get_top_students(limit: int = 5, level: int = None):
    profiles = _get_bulk_student_data(level)
    student_gpas = []
    
    for p in profiles:
        gpa = calculate_gpa(p["results"], p["baseline_units"], p["baseline_gps"])
        if gpa is not None:
            student_gpas.append({"matric_number": p["matric_number"], "gpa": gpa})
            
    student_gpas.sort(key=lambda x: x['gpa'], reverse=True)
    return student_gpas[:limit]

def get_at_risk_students(gpa_threshold: float = 2.0, level: int = None):
    profiles = _get_bulk_student_data(level)
    at_risk = []
    
    for p in profiles:
        gpa = calculate_gpa(p["results"], p["baseline_units"], p["baseline_gps"])
        if gpa is not None and gpa < gpa_threshold:
            at_risk.append({"matric_number": p["matric_number"], "gpa": gpa})
            
    at_risk.sort(key=lambda x: x['gpa'])
    return at_risk

def get_pass_fail_rate(course_code: str):
    dist = get_grade_distribution(course_code)
    total = sum(dist.values())
    
    if total == 0:
        return {"pass_rate": 0.0, "fail_rate": 0.0}
        
    fail_count = dist.get("F", 0)
    pass_count = total - fail_count
    
    return {
        "pass_rate": round((pass_count / total) * 100, 2),
        "fail_rate": round((fail_count / total) * 100, 2)
    }

def parse_term(session: str, semester: str):
    try:
        year = int(session.split('/')[0].strip())
    except Exception:
        year = 0
    sem = 1 if semester and semester.strip().lower() == 'first' else 2
    return (year, sem)

def get_all_carryovers(level: int = None):
    # Fetch students
    query = supabase.table('students').select('id, matric_number, current_level, outstanding_courses')
    if level:
        query = query.eq('current_level', level)
    students_res = query.execute()
    
    if not students_res.data:
        return []
        
    import re
    students_data = students_res.data
    student_ids = [s['id'] for s in students_data]
    
    all_results = []
    chunk_size = 100
    for i in range(0, len(student_ids), chunk_size):
        chunk = student_ids[i:i + chunk_size]
        res = supabase.table("results").select("student_id, score, grade, semester, session, courses(course_code, course_title, units, course_type, level)").in_("student_id", chunk).execute()
        if res.data:
            all_results.extend(res.data)
            
    id_to_student = {s['id']: s for s in students_data}
    results_by_matric = defaultdict(list)
    for r in all_results:
        student = id_to_student.get(r['student_id'])
        if not student: continue
        course = r.get("courses", {})
        results_by_matric[student['matric_number']].append({
            "course_code": course.get("course_code"),
            "grade": r.get("grade"),
            "semester": r.get("semester"),
            "session": r.get("session")
        })

    all_carryovers = []
    
    for student in students_data:
        matric = student['matric_number']
        
        # 1. Baseline carryovers
        baseline_str = student.get("outstanding_courses") or ""
        prev_courses = re.findall(r'[A-Za-z]{3}\s*\d{3}', baseline_str)
        outstanding = [{"course_code": c.upper().replace(" ", ""), "session": "Previous", "semester": "N/A"} for c in prev_courses]
        
        # 2. Dynamic carryovers from results
        results = results_by_matric.get(matric, [])
        for r in results:
            if r.get('grade') == 'F':
                course_code = r.get('course_code')
                failed_term = parse_term(r.get('session', ''), r.get('semester', ''))
                
                later_pass = False
                for later_r in results:
                    if later_r.get('course_code') == course_code and later_r.get('grade') != 'F':
                        later_term = parse_term(later_r.get('session', ''), later_r.get('semester', ''))
                        if later_term > failed_term:
                            later_pass = True
                            break
                
                if not later_pass:
                    # check if already in outstanding
                    norm_code = str(course_code).upper().replace(" ", "")
                    if not any(o.get('course_code', '').upper().replace(" ", "") == norm_code for o in outstanding):
                        outstanding.append({
                            "course_code": course_code,
                            "session": r.get('session'),
                            "semester": r.get('semester')
                        })
                        
        for c in outstanding:
            all_carryovers.append({
                "matric_number": matric,
                "course_code": c["course_code"],
                "session": c["session"],
                "semester": c["semester"]
            })
            
    return all_carryovers

