
from fastapi import FastAPI
from fastapi.testclient import TestClient

app = FastAPI()

@app.get('/students/{matric:path}/courses')
def get_c(matric: str):
    return {'matric': matric}

client = TestClient(app)
print(client.get('/students/FOS/22/23/100/courses').json())

