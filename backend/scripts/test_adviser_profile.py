import httpx

test_auth_user_id = '3fd9b1ee-0000-0000-0000-cbbe1d9326cf'
base = 'http://127.0.0.1:8000/auth'

# 1. Valid lookup
r1 = httpx.get(f'{base}/adviser-profile/{test_auth_user_id}')
print('1. GET /auth/adviser-profile/{auth_user_id} (valid)')
print(f'   Status:     {r1.status_code}')
data = r1.json()
print(f'   Name:       {data["name"]}')
print(f'   Email:      {data["email"]}')
print(f'   Department: {data["department"]}')
print(f'   verified:   {data["verified"]}')
print(f'   id:         {data["id"]}')

assert r1.status_code == 200
assert data["found"] == True

# 2. 404 case
r2 = httpx.get(f'{base}/adviser-profile/00000000-0000-0000-0000-000000000000')
print(f'\n2. GET /auth/adviser-profile/{{non-existent}}')
print(f'   Status: {r2.status_code}')
print(f'   Body:   {r2.json()}')

assert r2.status_code == 200
assert r2.json() == {"found": False}
print("\nAll assertions passed!")
