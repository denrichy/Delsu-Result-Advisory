from app.db import supabase

def get_student_results(matric_number: str):
    res = supabase.table("students").select("id").eq("matric_number", matric_number).execute()
    if not res.data:
        return []
        
    student_id = res.data[0]["id"]
    
    r_res = supabase.table("results").select("*, courses(course_code, units, course_type)").eq("student_id", student_id).execute()
    
    formatted_results = []
    for r in r_res.data:
        course = r.get("courses", {})
        formatted_results.append({
            "course_code": course.get("course_code"),
            "units": course.get("units"),
            "course_type": course.get("course_type"),
            "score": r.get("score"),
            "grade": r.get("grade"),
            "semester": r.get("semester"),
            "session": r.get("session")
        })
        
    return formatted_results

def calculate_gpa(results_list):
    total_grade_points = 0.0
    total_units = 0
    
    for r in results_list:
        score = r.get("score")
        units = r.get("units")
        
        if score is None or units is None:
            continue
            
        try:
            score_float = float(score)
            units_int = int(units)
        except (ValueError, TypeError):
            continue
            
        if score_float >= 70:
            gp = 5.0
        elif score_float >= 60:
            gp = 4.0
        elif score_float >= 50:
            gp = 3.0
        elif score_float >= 45:
            gp = 2.0
        else:
            gp = 0.0
            
        total_grade_points += (gp * units_int)
        total_units += units_int
        
    if total_units == 0:
        return 0.0
        
    gpa = total_grade_points / total_units
    return round(gpa, 2)

def get_semester_gpa(matric_number: str, semester: str, session: str):
    results = get_student_results(matric_number)
    filtered = [r for r in results if r.get("semester") == semester and r.get("session") == session]
    return calculate_gpa(filtered)

def get_cumulative_gpa(matric_number: str):
    results = get_student_results(matric_number)
    return calculate_gpa(results)

def get_course_breakdown(matric_number: str):
    return get_student_results(matric_number)
