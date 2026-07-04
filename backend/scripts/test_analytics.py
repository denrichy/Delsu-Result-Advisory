import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env')))

from app.analytics import (
    get_class_average,
    get_grade_distribution,
    get_top_students,
    get_at_risk_students,
    get_pass_fail_rate
)

def run_tests():
    course = 'CSC401'
    print(f"\n--- Analytics for {course} ---")
    
    print("1. Class Average:", get_class_average(course))
    
    print("2. Grade Distribution:", get_grade_distribution(course))
    
    print("3. Pass/Fail Rate:", get_pass_fail_rate(course))
    
    print("\n--- Student Analytics ---")
    
    print("4. Top 3 Students:")
    top_students = get_top_students(limit=3)
    for s in top_students:
        print(f"   - {s['matric_number']}: {s['gpa']}")
        
    print("5. At-Risk Students (GPA < 2.5):")
    at_risk = get_at_risk_students(gpa_threshold=2.5)
    if at_risk:
        for s in at_risk:
            print(f"   - {s['matric_number']}: {s['gpa']}")
    else:
        print("   - None found below threshold.")
        
if __name__ == "__main__":
    run_tests()
