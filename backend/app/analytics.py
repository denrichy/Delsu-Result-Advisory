from app.db import supabase
from app.performance import get_student_results, calculate_gpa

def get_class_average(course_code: str):
    course_res = supabase.table('courses').select('id').eq('course_code', course_code.upper()).execute()
    if not course_res.data:
        return None
    course_id = course_res.data[0]['id']
    
    results_res = supabase.table('results').select('score').eq('course_id', course_id).execute()
    scores = [r['score'] for r in results_res.data if r.get('score') is not None]
    
    if not scores:
        return 0.0
        
    return round(sum(scores) / len(scores), 2)

def get_grade_distribution(course_code: str):
    course_res = supabase.table('courses').select('id').eq('course_code', course_code.upper()).execute()
    distribution = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    
    if not course_res.data:
        return distribution
        
    course_id = course_res.data[0]['id']
    results_res = supabase.table('results').select('grade').eq('course_id', course_id).execute()
    
    for r in results_res.data:
        grade = r.get('grade')
        if grade in distribution:
            distribution[grade] += 1
            
    return distribution

def get_top_students(limit: int = 5):
    students_res = supabase.table('students').select('matric_number').execute()
    student_gpas = []
    
    for s in students_res.data:
        matric = s['matric_number']
        results = get_student_results(matric)
        if not results:
            continue
            
        gpa = calculate_gpa(results)
        if gpa is not None:
            student_gpas.append({"matric_number": matric, "gpa": gpa})
            
    student_gpas.sort(key=lambda x: x['gpa'], reverse=True)
    return student_gpas[:limit]

def get_at_risk_students(gpa_threshold: float = 2.0):
    students_res = supabase.table('students').select('matric_number').execute()
    at_risk = []
    
    for s in students_res.data:
        matric = s['matric_number']
        results = get_student_results(matric)
        if not results:
            continue
            
        gpa = calculate_gpa(results)
        if gpa is not None and gpa < gpa_threshold:
            at_risk.append({"matric_number": matric, "gpa": gpa})
            
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

def get_student_carryovers(matric_number: str):
    results = get_student_results(matric_number)
    
    outstanding = []
    
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
                if not any(x['course_code'] == course_code for x in outstanding):
                    outstanding.append({
                        "course_code": course_code,
                        "session": r.get('session'),
                        "semester": r.get('semester')
                    })
                    
    return outstanding

def get_all_carryovers():
    students_res = supabase.table('students').select('matric_number').execute()
    all_carryovers = []
    
    for s in students_res.data:
        matric = s['matric_number']
        student_carryovers = get_student_carryovers(matric)
        for c in student_carryovers:
            all_carryovers.append({
                "matric_number": matric,
                "course_code": c["course_code"],
                "session": c["session"],
                "semester": c["semester"]
            })
            
    return all_carryovers

