import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.performance import (
    get_student_results,
    calculate_gpa,
    get_semester_gpa,
    get_cumulative_gpa,
    get_course_breakdown
)

def run_tests():
    matric = "FOS/22/23/100001"
    print(f"--- Testing Performance Functions for {matric} ---")
    
    # 1. get_student_results
    results = get_student_results(matric)
    print(f"\n1. get_student_results() returned {len(results)} rows.")
    
    # 2. calculate_gpa
    gpa = calculate_gpa(results)
    print(f"\n2. calculate_gpa() over all results: {gpa}")
    
    # 3. get_semester_gpa
    sem_gpa = get_semester_gpa(matric, "First", "2025/2026")
    print(f"\n3. get_semester_gpa(First, 2025/2026): {sem_gpa}")
    
    # 4. get_cumulative_gpa
    cgpa = get_cumulative_gpa(matric)
    print(f"\n4. get_cumulative_gpa(): {cgpa}")
    
    # 5. get_course_breakdown
    breakdown = get_course_breakdown(matric)
    print(f"\n5. get_course_breakdown():")
    for r in breakdown:
        print(f"   {r['course_code']} ({r['units']} units) - Score: {r['score']}, Grade: {r['grade']} [{r['semester']} {r['session']}]")

if __name__ == "__main__":
    run_tests()
