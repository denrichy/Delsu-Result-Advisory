from fastapi import APIRouter, HTTPException
from app.db import supabase

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/advisers/pending")
def get_pending_advisers():
    try:
        res = supabase.table("advisers").select("*").eq("verified", False).execute()
        return {"pending": res.data, "count": len(res.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/advisers/{adviser_id}/verify")
def verify_adviser(adviser_id: str):
    try:
        # Check adviser exists
        check = supabase.table("advisers").select("*").eq("id", adviser_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Adviser not found.")

        res = supabase.table("advisers") \
            .update({"verified": True}) \
            .eq("id", adviser_id) \
            .execute()

        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to verify adviser.")

        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
