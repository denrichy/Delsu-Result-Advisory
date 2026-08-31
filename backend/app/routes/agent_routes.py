from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from app.agent import run_agent, run_agent_stream
from app.db import supabase

router = APIRouter(prefix="/agent", tags=["agent"])

class ChatRequest(BaseModel):
    matric_number: str
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = Field(default_factory=list)

class StreamChatRequest(BaseModel):
    matric_number: str
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    session_id: Optional[str] = None

import traceback

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
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
def stream_chat_with_agent(data: StreamChatRequest, background_tasks: BackgroundTasks):
    try:
        generator = run_agent_stream(
            matric_number=data.matric_number,
            user_message=data.message,
            conversation_history=data.conversation_history,
            session_id=data.session_id
        )
        return StreamingResponse(generator, media_type="text/event-stream")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── Chat Session CRUD ───

class CreateSessionRequest(BaseModel):
    matric_number: str
    title: str = "New Chat"

class UpdateSessionRequest(BaseModel):
    title: Optional[str] = None
    is_pinned: Optional[bool] = None

class SaveMessageRequest(BaseModel):
    role: str
    content: str


@router.post("/sessions")
def create_session(data: CreateSessionRequest):
    """Create a new chat session."""
    try:
        res = supabase.table("chat_sessions").insert({
            "matric_number": data.matric_number,
            "title": data.title,
        }).execute()
        if res.data and len(res.data) > 0:
            return {"session": res.data[0]}
        raise HTTPException(status_code=500, detail="Failed to create session")
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: str):
    """Get all messages for a session."""
    try:
        res = supabase.table("chat_messages") \
            .select("id, role, content, created_at") \
            .eq("session_id", session_id) \
            .order("created_at", desc=False) \
            .execute()
        return {"messages": res.data or []}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/messages")
def save_message(session_id: str, data: SaveMessageRequest):
    """Save a message to a session and update session's updated_at."""
    try:
        # Insert the message
        msg_res = supabase.table("chat_messages").insert({
            "session_id": session_id,
            "role": data.role,
            "content": data.content,
        }).execute()

        # Update session's updated_at timestamp
        from datetime import datetime, timezone
        supabase.table("chat_sessions") \
            .update({"updated_at": datetime.now(timezone.utc).isoformat()}) \
            .eq("id", session_id) \
            .execute()

        if msg_res.data and len(msg_res.data) > 0:
            return {"message": msg_res.data[0]}
        raise HTTPException(status_code=500, detail="Failed to save message")
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/sessions/{session_id}")
def update_session(session_id: str, data: UpdateSessionRequest):
    """Update session title."""
    try:
        update_data = {}
        if data.title is not None:
            update_data["title"] = data.title
        if data.is_pinned is not None:
            update_data["is_pinned"] = data.is_pinned

        if not update_data:
            raise HTTPException(status_code=400, detail="Nothing to update")

        res = supabase.table("chat_sessions") \
            .update(update_data) \
            .eq("id", session_id) \
            .execute()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str):
    """Delete a chat session and all its messages."""
    try:
        # Delete messages first
        supabase.table("chat_messages") \
            .delete() \
            .eq("session_id", session_id) \
            .execute()

        # Delete session
        supabase.table("chat_sessions") \
            .delete() \
            .eq("id", session_id) \
            .execute()

        return {"ok": True}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{matric_number:path}")
def list_sessions(matric_number: str):
    """List all chat sessions for a student, newest first."""
    try:
        # Also ensure we handle URL encoded slashes correctly if Starlette didn't fully decode
        import urllib.parse
        clean_matric = urllib.parse.unquote(matric_number)
        
        res = supabase.table("chat_sessions") \
            .select("id, title, is_pinned, created_at, updated_at") \
            .eq("matric_number", clean_matric) \
            .order("is_pinned", desc=True) \
            .order("updated_at", desc=True) \
            .execute()
        return {"sessions": res.data or []}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
