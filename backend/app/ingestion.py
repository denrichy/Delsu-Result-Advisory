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

def melt_wide_format(filepath, course_columns):
    df = pd.read_excel(filepath, header=None)
    if len(df) < 4:
        return [], []
        
    row_0 = df.iloc[0].astype(str).str.strip().tolist()
    course_indices = {}
    for code in course_columns:
        for i, val in enumerate(row_0):
            if val == code:
                course_indices[code] = i
                break
                
    row_1 = df.iloc[1].tolist()
    row_2 = df.iloc[2].astype(str).str.strip().tolist()
    
    course_metadata = {}
    for code, idx in course_indices.items():
        units_val = row_1[idx]
        c_type = row_2[idx].upper() if pd.notna(row_2[idx]) and str(row_2[idx]).strip() != "nan" else None
        try:
            units = int(float(units_val))
        except:
            units = None
        
        course_metadata[code] = {
            "course_code": code,
            "units": units,
            "course_type": c_type
        }
        
    matric_idx = -1
    sex_idx = -1
    matric_regex = re.compile(r'matric|reg\s*no|registration', re.IGNORECASE)
    for i, val in enumerate(row_0):
        if matric_regex.search(val):
            matric_idx = i
        elif "sex" in val.lower():
            sex_idx = i
            
    long_format_data = []
    for _, row in df.iloc[3:].iterrows():
        matric = row[matric_idx] if matric_idx != -1 else None
        if pd.isna(matric) or str(matric).strip() == "":
            continue
            
        sex = row[sex_idx] if sex_idx != -1 else None
        sex = str(sex).strip() if pd.notna(sex) and str(sex).strip() != "nan" else None
        
        for code, idx in course_indices.items():
            cell_val = row[idx]
            if pd.isna(cell_val) or str(cell_val).strip() == "":
                continue
                
            parsed = parse_score_grade(cell_val)
            if parsed:
                long_format_data.append({
                    "matric_number": str(matric).strip(),
                    "sex": sex,
                    "course_code": code,
                    "units": course_metadata[code]["units"],
                    "course_type": course_metadata[code]["course_type"],
                    "score": parsed["score"],
                    "grade": parsed["grade"]
                })
                
    return long_format_data, list(course_metadata.values())
