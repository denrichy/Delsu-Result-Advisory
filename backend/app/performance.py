from app.db import supabase

def get_student_results(matric_number: str):
    res = supabase.table("students").select("id").eq("matric_number", matric_number).execute()
    if not res.data:
        return []
        
    student_id = res.data[0]["id"]
    
    r_res = supabase.table("results").select("*, courses(course_code, course_title, units, course_type, level)").eq("student_id", student_id).execute()
    
    formatted_results = []
    for r in r_res.data:
        course = r.get("courses", {})
        formatted_results.append({
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
        
    return formatted_results

def calculate_gpa(results_list, baseline_units=0, baseline_gps=0.0):
    total_grade_points = float(baseline_gps)
    total_units = int(baseline_units)
    
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
        if len(results_list) > 0 and baseline_units == 0:
            return 0.0
        return None
        
    gpa = total_grade_points / total_units
    return round(gpa, 2)

def get_semester_gpa(matric_number: str, semester: str, session: str):
    results = get_student_results(matric_number)
    filtered = [r for r in results if r.get("semester") == semester and r.get("session") == session]
    return calculate_gpa(filtered)

def get_cumulative_gpa(matric_number: str, baseline_units=0, baseline_gps=0.0):
    # If not provided, fetch from database
    if baseline_units == 0 and baseline_gps == 0.0:
        student_res = supabase.table("students").select("baseline_units, baseline_gps").eq("matric_number", matric_number).execute()
        if student_res.data:
            baseline_units = student_res.data[0].get("baseline_units") or 0
            baseline_gps = student_res.data[0].get("baseline_gps") or 0.0
            
    results = get_student_results(matric_number)
    return calculate_gpa(results, baseline_units, baseline_gps)

def get_course_breakdown(matric_number: str):
    return get_student_results(matric_number)

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

def get_full_academic_record(matric_number: str):
    import re
    
    response = supabase.table("students").select("*").eq("matric_number", matric_number).execute()
    if not response.data:
        return {"error": "Student not found"}
        
    student = response.data[0]
    courses = get_student_results(matric_number)
    
    baseline_units = student.get("baseline_units") or 0
    baseline_gps = student.get("baseline_gps") or 0.0
    cgpa = calculate_gpa(courses, baseline_units, baseline_gps)
    
    previous_outstanding_str = student.get("outstanding_courses") or ""
    prev_courses = re.findall(r'[A-Za-z]{3}\s*\d{3}', previous_outstanding_str)
    previous_outstanding = [{"course_code": c.upper().replace(" ", "")} for c in prev_courses]
    outstanding = list(previous_outstanding)
    
    current_outstanding = []
    if courses:
        dynamic_carryovers = get_student_carryovers(matric_number)
        for dc in dynamic_carryovers:
            # Normalize the dynamic course code (remove spaces) for comparison
            normalized_dc = str(dc.get("course_code", "")).upper().replace(" ", "")
            if not any(o.get("course_code", "").upper().replace(" ", "") == normalized_dc for o in outstanding):
                outstanding.append(dc)
                current_outstanding.append(dc)
                
    return {
        "student_info": {
            "name": student.get("name"),
            "matric_number": matric_number,
            "current_level": student.get("current_level"),
            "cgpa": cgpa,
            "baseline_units": baseline_units,
            "baseline_gps": baseline_gps
        },
        "outstanding_courses": outstanding,
        "previous_outstanding": previous_outstanding,
        "current_outstanding": current_outstanding,
        "courses": courses
    }

def simulate_gpa(matric_number: str, course_code: str, hypothetical_input: str):
    results = get_student_results(matric_number)
    if not results:
        return {"error": "Student not found or has no results."}
    
    current_gpa = calculate_gpa(results)
    
    letter = str(hypothetical_input).upper().strip()
    if letter == 'A':
        hypothetical_score = 75.0
    elif letter == 'B':
        hypothetical_score = 65.0
    elif letter == 'C':
        hypothetical_score = 55.0
    elif letter == 'D':
        hypothetical_score = 45.0
    elif letter == 'F':
        hypothetical_score = 0.0
    else:
        try:
            hypothetical_score = float(hypothetical_input)
            if hypothetical_score < 0 or hypothetical_score > 100:
                return {"error": "that's not a valid score — scores range from 0 to 100"}
        except ValueError:
            return {"error": f"Invalid hypothetical_input: {hypothetical_input}"}
    
    course_found = False
    current_grade = None
    for r in results:
        if r.get("course_code") and r.get("course_code").upper() == course_code.upper():
            current_grade = r.get("grade")
            r["score"] = hypothetical_score
            course_found = True
            break
            
    if not course_found:
        return {"error": f"Course {course_code} not found in student's record."}
        
    hypothetical_gpa = calculate_gpa(results)
    
    return {
        "hypothetical_gpa": hypothetical_gpa,
        "current_gpa": current_gpa,
        "course": course_code,
        "current_grade": current_grade,
        "hypothetical_score": hypothetical_score
    }

def simulate_gpa_uniform(matric_number: str, hypothetical_grade_letter: str):
    results = get_student_results(matric_number)
    if not results:
        return {"error": "Student not found or has no results."}
    
    current_gpa = calculate_gpa(results)
    
    # Map letter to canonical score
    letter = hypothetical_grade_letter.upper().strip()
    if letter == 'A':
        score = 75.0
    elif letter == 'B':
        score = 65.0
    elif letter == 'C':
        score = 55.0
    elif letter == 'D':
        score = 45.0
    elif letter == 'F':
        score = 0.0
    else:
        return {"error": f"Invalid grade letter: {hypothetical_grade_letter}"}
        
    for r in results:
        r["score"] = score
        
    hypothetical_gpa = calculate_gpa(results)
    
    return {
        "hypothetical_gpa": hypothetical_gpa,
        "current_gpa": current_gpa,
        "hypothetical_grade": letter
    }

def check_graduation_prospects(matric_number: str):
    student_res = supabase.table("students").select("baseline_units, baseline_gps, current_level").eq("matric_number", matric_number).execute()
    if not student_res.data:
        return {"error": "Student not found."}
        
    baseline_units = student_res.data[0].get("baseline_units") or 0
    baseline_gps = student_res.data[0].get("baseline_gps") or 0.0
    current_level = student_res.data[0].get("current_level")
    
    if current_level is None:
        return {"error": "Current level is missing for this student; cannot calculate remaining semesters."}
        
    results = get_student_results(matric_number)
    
    # Calculate current semester's units and GPS manually
    semester_gps = 0.0
    semester_units = 0
    
    has_first_semester = False
    has_second_semester = False
    
    for r in results:
        r_level = r.get("level")
        r_sem = r.get("semester")
        if r_level and int(r_level) == current_level:
            if r_sem == "First Semester": has_first_semester = True
            elif r_sem == "Second Semester": has_second_semester = True
            
        score = r.get("score")
        units = r.get("units")
        if score is None or units is None: continue
        try:
            score_float = float(score)
            units_int = int(units)
        except: continue
            
        if score_float >= 70: gp = 5.0
        elif score_float >= 60: gp = 4.0
        elif score_float >= 50: gp = 3.0
        elif score_float >= 45: gp = 2.0
        else: gp = 0.0
            
        semester_gps += (gp * units_int)
        semester_units += units_int

    total_current_units = baseline_units + semester_units
    total_current_gps = baseline_gps + semester_gps
    
    if total_current_units == 0:
        return {"error": "No accumulated units found."}
        
    current_cgpa = round(total_current_gps / total_current_units, 2)
    
    level_index = current_level // 100
    completed_semesters = (level_index - 1) * 2
    if has_second_semester:
        completed_semesters += 2
    elif has_first_semester:
        completed_semesters += 1
        
    remaining_semesters = 8 - completed_semesters
    if remaining_semesters < 0: remaining_semesters = 0
    
    max_future_units = remaining_semesters * 24
    max_future_gps = max_future_units * 5.0
    
    max_possible_cgpa_raw = (total_current_gps + max_future_gps) / (total_current_units + max_future_units)
    max_possible_cgpa = round(max_possible_cgpa_raw, 2)
    
    can_first_class = max_possible_cgpa >= 4.50
    can_second_upper = max_possible_cgpa >= 3.50
    
    breakdown = (
        f"Current Total Units: {total_current_units}. Current Total GPS: {total_current_gps}. Current CGPA: {current_cgpa}. "
        f"Assuming {remaining_semesters} semester(s) remain in your program, registering for the maximum allowable {max_future_units} units "
        f"and scoring straight A's ({max_future_gps} points), the final CGPA calculation would be "
        f"({total_current_gps} + {max_future_gps}) / ({total_current_units} + {max_future_units}) = {max_possible_cgpa}. "
        f"Therefore, graduating with a First Class (4.50) is {'POSSIBLE' if can_first_class else 'IMPOSSIBLE'}."
    )
    
    return {
        "current_cgpa": current_cgpa,
        "absolute_maximum_possible_cgpa": max_possible_cgpa,
        "is_first_class_possible": can_first_class,
        "is_second_class_upper_possible": can_second_upper,
        "math_breakdown": breakdown
    }
