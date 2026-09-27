from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from app.agent import run_agent, run_agent_stream
from app.db import supabase_admin as supabase
from app.security import require_student

router = APIRouter(prefix="/agent", tags=["agent"], dependencies=[Depends(require_student)])

class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    matric_number: str = Field(min_length=1, max_length=100)
    message: str = Field(min_length=1, max_length=8000)
    conversation_history: List[ConversationMessage] = Field(default_factory=list, max_length=20)

class StreamChatRequest(BaseModel):
    matric_number: str = Field(min_length=1, max_length=100)
    message: str = Field(min_length=1, max_length=8000)
    conversation_history: List[ConversationMessage] = Field(default_factory=list, max_length=20)
    session_id: Optional[str] = None

import traceback

@router.post("/chat")
def chat_with_agent(data: ChatRequest, actor=Depends(require_student)):
    try:
        if data.matric_number != actor["profile"]["matric_number"]:
            raise HTTPException(status_code=403, detail="You can only use the adviser for your own record")
        response = run_agent(
            matric_number=data.matric_number,
            user_message=data.message,
            conversation_history=[message.model_dump() for message in data.conversation_history]
        )
        return {"response": response}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
def stream_chat_with_agent(data: StreamChatRequest, background_tasks: BackgroundTasks, actor=Depends(require_student)):
    try:
        if data.matric_number != actor["profile"]["matric_number"]:
            raise HTTPException(status_code=403, detail="You can only use the adviser for your own record")
        if data.session_id:
            _require_owned_session(data.session_id, data.matric_number)
        generator = run_agent_stream(
            matric_number=data.matric_number,
            user_message=data.message,
            conversation_history=[message.model_dump() for message in data.conversation_history],
            session_id=data.session_id
        )
        return StreamingResponse(generator, media_type="text/event-stream")
    except HTTPException:
        raise
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
    role: Literal["user"] = "user"
    content: str = Field(min_length=1, max_length=8000)


@router.post("/sessions")
def create_session(data: CreateSessionRequest, actor=Depends(require_student)):
    """Create a new chat session."""
    try:
        if data.matric_number != actor["profile"]["matric_number"]:
            raise HTTPException(status_code=403, detail="You can only create your own sessions")
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
def get_session_messages(session_id: str, actor=Depends(require_student)):
    """Get all messages for a session."""
    try:
        _require_owned_session(session_id, actor["profile"]["matric_number"])
        res = supabase.table("chat_messages") \
            .select("id, role, content, created_at") \
            .eq("session_id", session_id) \
            .order("created_at", desc=False) \
            .execute()
        return {"messages": res.data or []}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/messages")
def save_message(session_id: str, data: SaveMessageRequest, actor=Depends(require_student)):
    """Save a message to a session and update session's updated_at."""
    try:
        _require_owned_session(session_id, actor["profile"]["matric_number"])
        # Insert the message
        msg_res = supabase.table("chat_messages").insert({
            "session_id": session_id,
            "role": "user",
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
def update_session(session_id: str, data: UpdateSessionRequest, actor=Depends(require_student)):
    """Update session title."""
    try:
        _require_owned_session(session_id, actor["profile"]["matric_number"])
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
def delete_session(session_id: str, actor=Depends(require_student)):
    """Delete a chat session and all its messages."""
    try:
        _require_owned_session(session_id, actor["profile"]["matric_number"])
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
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{matric_number:path}")
def list_sessions(matric_number: str, actor=Depends(require_student)):
    """List all chat sessions for a student, newest first."""
    try:
        # Also ensure we handle URL encoded slashes correctly if Starlette didn't fully decode
        import urllib.parse
        clean_matric = urllib.parse.unquote(matric_number)
        if clean_matric != actor["profile"]["matric_number"]:
            raise HTTPException(status_code=403, detail="You can only list your own sessions")
        
        res = supabase.table("chat_sessions") \
            .select("id, title, is_pinned, created_at, updated_at") \
            .eq("matric_number", clean_matric) \
            .order("is_pinned", desc=True) \
            .order("updated_at", desc=True) \
            .execute()
        return {"sessions": res.data or []}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


def _require_owned_session(session_id: str, matric_number: str):
    result = (
        supabase.table("chat_sessions")
        .select("id")
        .eq("id", session_id)
        .eq("matric_number", matric_number)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
