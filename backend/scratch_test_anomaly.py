import requests

url = "http://127.0.0.1:8000/upload/preview"
files = {'file': open(r'C:\Users\HP\Desktop\FYP\just-testing\400_LEVEL_STUDENTS_COPY_1ST_SEMESTER_COMPUTER_SCIE_260701_222840.xlsx', 'rb')}
res = requests.post(url, files=files)

data = res.json()
print("Anomalies found:", len(data.get('anomalies', [])))
for a in data.get('anomalies', []):
    print(f"{a['matric_number']} - {a['details']}")
