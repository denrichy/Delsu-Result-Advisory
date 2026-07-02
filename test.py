import requests
import json

r = requests.post(
    'http://127.0.0.1:8000/upload/preview',
    files={'file': open('backend/scripts/dummy_sheets/wide_broadsheet_format.xlsx', 'rb')}
)
data = r.json()
print(f'Length of preview_rows: {len(data.get("preview_rows", []))}')
print(f'Length of all_rows: {len(data.get("all_rows", []))}')
print(f'Total row count detected: {data.get("total_row_count")}')
