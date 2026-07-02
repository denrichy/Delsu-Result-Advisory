from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.db import supabase
from app.routes import students, upload

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(students.router)
app.include_router(upload.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/test-db")
def test_db():
    try:
        response = supabase.table("courses").select("*", count="exact").execute()
        return {"courses_count": response.count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
