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
                "detected_course_columns": [],
                "header_idx": header_idx
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

def detect_long_format_columns(df):
    mapping = {
        "matric_number": None,
        "name": None,
        "course_code": None,
        "score_type": "single",
        "score": None,
        "ca_column": None,
        "exam_column": None,
        "grade": None,
        "score_needs_parsing": False,
        "confidence": {}
    }
    
    matric_regex = re.compile(r'^[A-Za-z]{2,}(?:/[A-Za-z0-9]+)+$')
    course_regex = re.compile(r'^[A-Za-z]{2,4}\s*\d{3}$')
    concat_score_regex = re.compile(r'^(\d+)([A-F])$')
    grade_regex = re.compile(r'^[A-F]$')
    
    sn_patterns = ["s/n", "sn", "serial", "no", "#"]
    
    scores_for_cols = {col: {"matric": 0, "name": 0, "course": 0, "plain_score": 0, "concat_score": 0, "grade": 0} for col in df.columns}
    
    for col in df.columns:
        col_str = str(col).lower().strip()
        if col_str in sn_patterns or col_str.replace(".", "") in sn_patterns:
            continue
            
        vals = df[col].dropna().astype(str).str.strip().tolist()
        if not vals:
            continue
            
        n = min(len(vals), 50)
        test_vals = vals[:n]
        counts = {"matric": 0, "name": 0, "course": 0, "plain_score": 0, "concat_score": 0, "grade": 0}
        
        for val in test_vals:
            if course_regex.match(val):
                counts["course"] += 1
            elif grade_regex.match(val.upper()):
                counts["grade"] += 1
            elif concat_score_regex.match(val.upper()):
                counts["concat_score"] += 1
            elif val.isdigit():
                counts["plain_score"] += 1
            elif matric_regex.match(val):
                counts["matric"] += 1
                
            words = val.split()
            if len(words) >= 2:
                valid_name = True
                has_alpha = False
                for w in words:
                    if w[0].isalpha():
                        has_alpha = True
                        if not w[0].isupper():
                            valid_name = False
                            break
                if valid_name and has_alpha:
                    counts["name"] += 1
                
        scores_for_cols[col] = {k: v/n for k, v in counts.items()}

    def assign_highest(category):
        best_col = None
        best_score = 0.0
        for col, scores in scores_for_cols.items():
            if scores[category] > best_score and scores[category] > 0.3:
                best_score = scores[category]
                best_col = col
        if best_col:
            mapping["confidence"][category] = round(best_score, 2)
            return best_col
        return None
        
    mapping["matric_number"] = assign_highest("matric")
    mapping["name"] = assign_highest("name")
    mapping["course_code"] = assign_highest("course")
    
    ca_col = None
    exam_col = None
    best_plain_cols = []
    
    for col, scores in scores_for_cols.items():
        if scores["plain_score"] > 0.3:
            best_plain_cols.append(col)
            
    for col in best_plain_cols:
        col_str = str(col).lower()
        if any(k in col_str for k in ["ca", "test", "assignment"]):
            ca_col = col
        elif any(k in col_str for k in ["exam", "final"]):
            exam_col = col
            
    if ca_col and exam_col:
        mapping["score_type"] = "split"
        mapping["ca_column"] = ca_col
        mapping["exam_column"] = exam_col
        mapping["confidence"]["score"] = 1.0
    else:
        best_score_col = None
        best_score_val = 0.0
        best_is_concat = False
        
        for col, scores in scores_for_cols.items():
            col_str = str(col).lower()
            if scores["concat_score"] > 0.3:
                best_score_val = scores["concat_score"]
                best_score_col = col
                best_is_concat = True
                break
                
            if scores["plain_score"] > 0.3:
                score_val = scores["plain_score"]
                if any(k in col_str for k in ["total", "score", "mark", "agg"]):
                    score_val += 0.5
                    
                if score_val > best_score_val:
                    best_score_val = score_val
                    best_score_col = col
                    
        if best_score_col:
            mapping["score"] = best_score_col
            mapping["score_needs_parsing"] = best_is_concat
            mapping["confidence"]["score"] = round(min(1.0, max(0.0, best_score_val)), 2)
            
    if not mapping.get("score_needs_parsing", False):
        mapping["grade"] = assign_highest("grade")
        
    return mapping
