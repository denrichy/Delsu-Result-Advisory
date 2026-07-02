import httpx
import sys
import os
import uuid

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.db import supabase

base_url = 'http://127.0.0.1:8000/auth'

print('--- Testing Auth Endpoints ---')

# Test 1: New student
data_new = {
    'matric_number': 'FOS/22/23/100004',
    'email': 'new.student@delsu.edu.ng',
    'auth_user_id': str(uuid.uuid4())
}
r1 = httpx.post(f'{base_url}/student-signup', json=data_new)
print(f'\n1. New Student (100004): {r1.json()}')

# Test 2: Existing student
data_existing = {
    'matric_number': 'FOS/22/23/100001',
    'email': 'existing.student@delsu.edu.ng',
    'auth_user_id': str(uuid.uuid4())
}
r2 = httpx.post(f'{base_url}/student-signup', json=data_existing)
print(f'\n2. Claim Existing Student (100001): {r2.json()}')

# Verify in DB
print('\n--- DB VERIFICATION ---')
res = supabase.table('students').select('*').in_('matric_number', ['FOS/22/23/100001', 'FOS/22/23/100004']).execute()
for s in res.data:
    print(f"- {s['matric_number']} | email: {s.get('email')} | auth_user_id: {s.get('auth_user_id')}")
