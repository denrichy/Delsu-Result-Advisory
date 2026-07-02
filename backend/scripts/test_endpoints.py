
import httpx

base_url = 'http://127.0.0.1:8000/students'
matric = 'FOS/22/23/100001'

print('--- Testing Endpoints ---')

r1 = httpx.get(f'{base_url}/{matric}/gpa/semester?semester=First&session=2025/2026')
print(f'\n1. Semester GPA: {r1.json()}')

r2 = httpx.get(f'{base_url}/{matric}/gpa/cumulative')
print(f'\n2. Cumulative GPA: {r2.json()}')

r3 = httpx.get(f'{base_url}/{matric}/courses')
print(f'\n3. Courses Breakdown: {r3.json()}')

