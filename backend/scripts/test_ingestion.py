import os
import sys

# Add backend directory to path so we can import 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.ingestion import detect_sheet_format, parse_score_grade, melt_wide_format

def test():
    dummy_dir = os.path.join(os.path.dirname(__file__), 'dummy_sheets')
    files = ["simple_long_format.xlsx", "wide_broadsheet_format.xlsx", "inconsistent_columns.xlsx"]
    
    print("--- Testing detect_sheet_format ---")
    for f in files:
        filepath = os.path.join(dummy_dir, f)
        if not os.path.exists(filepath):
            print(f"Error: {f} not found!")
            continue
            
        result = detect_sheet_format(filepath)
        print(f"{f}: {result}")
        
    print("\n--- Testing parse_score_grade ---")
    test_vals = ["67B", "100A", "44F", 55, None, ""]
    for v in test_vals:
        print(f"Value {repr(v)} -> {parse_score_grade(v)}")
        
    print("\n--- Testing melt_wide_format ---")
    wide_path = os.path.join(dummy_dir, "wide_broadsheet_format.xlsx")
    detect_res = detect_sheet_format(wide_path)
    cols = detect_res.get("detected_course_columns", [])
    if cols:
        long_data, metadata = melt_wide_format(wide_path, cols)
        print("Course Metadata extracted:")
        for m in metadata:
            print(f"  {m}")
        print("\nFirst 5 melted rows:")
        for r in long_data[:5]:
            print(f"  {r}")
    else:
        print("Failed to detect columns for wide format")

if __name__ == "__main__":
    test()
