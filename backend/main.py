from fastapi import FastAPI, HTTPException
from app.db import supabase

app = FastAPI()

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
