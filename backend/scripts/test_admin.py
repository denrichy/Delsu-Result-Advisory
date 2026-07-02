import httpx
import json

adviser_id = '3fd9b1ee-eb2d-4f62-a4d7-cbbe1d9326cf'
base = 'http://127.0.0.1:8000/admin'

# 1. GET pending advisers
r1 = httpx.get(f'{base}/advisers/pending')
data1 = r1.json()
print('1. GET /admin/advisers/pending')
print(f'   Status: {r1.status_code}')
print(f'   Count:  {data1["count"]} pending')
for a in data1['pending']:
    print(f'   - {a["name"]} ({a["email"]}) | verified={a["verified"]}')

# 2. PATCH verify
r2 = httpx.patch(f'{base}/advisers/{adviser_id}/verify')
data2 = r2.json()
print(f'\n2. PATCH /admin/advisers/{adviser_id}/verify')
print(f'   Status:   {r2.status_code}')
print(f'   Name:     {data2["name"]}')
print(f'   Email:    {data2["email"]}')
print(f'   verified: {data2["verified"]}')

# 3. Confirm gone from pending
r3 = httpx.get(f'{base}/advisers/pending')
data3 = r3.json()
print(f'\n3. GET /admin/advisers/pending (after verify)')
print(f'   Status: {r3.status_code}')
print(f'   Count:  {data3["count"]} pending')
