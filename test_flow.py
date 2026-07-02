import requests
import uuid

# 1. Preview
r_prev = requests.post(
    'http://127.0.0.1:8000/upload/preview',
    files={'file': open('backend/scripts/dummy_sheets/wide_broadsheet_format.xlsx', 'rb')}
)
data = r_prev.json()
all_rows = data.get("all_rows", [])

# 2. Confirm
r_conf = requests.post(
    'http://127.0.0.1:8000/upload/confirm',
    json={
        "rows": all_rows,
        "semester": "First Semester",
        "session": "2025/2026",
        "adviser_id": "09583752-673c-409d-957b-948794f54632", # valid adviser id
        "filename": "wide_broadsheet_format.xlsx"
    }
)
print("Confirm Response:")
print(r_conf.json())
