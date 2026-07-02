import pandas as pd
import re

def detect_sheet_format(filepath):
    # Read first 50 rows without headers to inspect raw structure
    df = pd.read_excel(filepath, header=None, nrows=50)
    if df.empty:
        return {"format": "unknown", "confidence": 0.0, "detected_course_columns": []}

    course_code_regex = re.compile(r'^[A-Za-z]{2,4}\s*\d{3}$')
    matric_regex = re.compile(r'matric|reg\s*no|registration', re.IGNORECASE)

    # 1. Check for WIDE format
    # The first row's headers include multiple values that look like course codes
    row_0 = df.iloc[0].astype(str).tolist()
    wide_course_cols = []
    for val in row_0:
        if course_code_regex.match(val.strip()):
            wide_course_cols.append(val.strip())

    if len(wide_course_cols) >= 1:
        # Confidence increases with the number of course columns detected
        confidence = min(1.0, 0.7 + (len(wide_course_cols) * 0.05))
        return {
            "format": "wide",
            "confidence": round(confidence, 2),
            "detected_course_columns": wide_course_cols
        }

    # 2. Check for LONG format
    header_idx = -1
    for idx, row in df.iterrows():
        if any(matric_regex.search(str(val)) for val in row):
            header_idx = idx
            break

    if header_idx != -1:
        # Check if any column contains course codes as values below the header
        has_course_values = False
        data_df = df.iloc[header_idx+1:]
        
        for col in data_df.columns:
            for val in data_df[col].dropna():
                if course_code_regex.match(str(val).strip()):
                    has_course_values = True
                    break
            if has_course_values:
                break
        
        if has_course_values:
            return {
                "format": "long",
                "confidence": 0.9,
                "detected_course_columns": []
            }

    return {"format": "unknown", "confidence": 0.0, "detected_course_columns": []}

def parse_score_grade(cell_value):
    if cell_value is None or pd.isna(cell_value) or str(cell_value).strip() == "":
        return None
    
    val_str = str(cell_value).strip().upper()
    
    # Try regex ^(\d+)([A-F])$ for concatenated scores like '67B'
    match = re.match(r'^(\d+)([A-F])$', val_str)
    if match:
        return {"score": int(match.group(1)), "grade": match.group(2)}
    
    # Fallback for plain number
    if val_str.isdigit():
        return {"score": int(val_str), "grade": None}
    
    # Try parsing as float first in case it's something like "55.0"
    try:
        score = int(float(val_str))
        return {"score": score, "grade": None}
    except ValueError:
        return None
