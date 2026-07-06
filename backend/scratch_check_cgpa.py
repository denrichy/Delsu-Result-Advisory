import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))

from app.performance import get_full_academic_record

matric_number = "FOS/21/22/276003"
record = get_full_academic_record(matric_number)

print(f"CGPA for {matric_number}: {record.get('student_info', {}).get('cgpa')}")
