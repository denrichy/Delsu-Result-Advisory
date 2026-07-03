from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from app.agent import run_agent

router = APIRouter(prefix="/agent", tags=["agent"])

class ChatRequest(BaseModel):
    matric_number: str
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = Field(default_factory=list)

@router.post("/chat")
def chat_with_agent(data: ChatRequest):
    try:
        response = run_agent(
            matric_number=data.matric_number,
            user_message=data.message,
            conversation_history=data.conversation_history
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
