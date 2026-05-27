"""
MediScan - Chat API Router
===========================
Chat endpoints with the AI medical assistant.
"""

import os
import sys
import uuid
import logging
from datetime import datetime
from typing import Dict, Any

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src'))

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from .models import ChatRequest, ChatResponse, ClearSessionRequest

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# LAZY LOADING
# ============================================================================

_agent_loaded = False
_agent_runner = None
_cache_loaded = False
_cache_module = None


def load_cache() -> Dict[str, Any]:
    """Lazy load the cache module."""
    global _cache_loaded, _cache_module
    if not _cache_loaded:
        logger.info("🔄 Loading cache module...")
        from src.cache import (
            get_cached_chat_response, cache_chat_response,
            get_all_cache_stats, clear_all_caches
        )
        _cache_module = {
            "get_chat": get_cached_chat_response,
            "set_chat": cache_chat_response,
            "stats": get_all_cache_stats,
            "clear": clear_all_caches
        }
        _cache_loaded = True
        logger.info("✅ Cache module loaded")
    return _cache_module


def load_agent() -> Dict[str, Any]:
    """Lazy load the agent module."""
    global _agent_loaded, _agent_runner
    if not _agent_loaded:
        logger.info("🔄 Loading MediScan agent...")
        from src.agent import safe_run_agent_streaming, clear_memory, memory, get_agent_executor
        _agent_runner = {
            "stream": safe_run_agent_streaming,
            "clear": clear_memory,
            "memory": memory,
            "get_executor": get_agent_executor
        }
        _agent_loaded = True
        logger.info("✅ Agent loaded successfully")
    return _agent_runner


def get_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now().isoformat()


def generate_session_id() -> str:
    """Generate a unique session ID."""
    return f"session_{uuid.uuid4().hex[:12]}"


# ============================================================================
# CHAT ENDPOINTS
# ============================================================================

@router.post("/", response_model=ChatResponse, summary="Chat with AI Assistant")
async def chat(request: ChatRequest):
    """
    الدردشة مع المساعد الطبي الذكي.
    
    - **message**: رسالة المستخدم
    - **session_id**: (اختياري) معرف الجلسة للحفاظ على سياق المحادثة
    - **patient_id**: (اختياري) معرف المريض لحفظ المحادثة في التاريخ المرضي
    - **user_role**: 'doctor' (English/clinical) or 'patient' (Arabic/simple)
    """
    try:
        # Generate session ID if not provided
        session_id = request.session_id or generate_session_id()
        
        # Get user role (default: patient)
        user_role = request.user_role.lower() if request.user_role else "patient"
        logger.info(f"Chat request - Role: {user_role.upper()}")
        
        # Validate message
        if not request.message or not request.message.strip():
            error_msg = "Message cannot be empty." if user_role == "doctor" else "الرسالة فاضية. اكتب سؤالك من فضلك."
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Check cache first (only for patient mode to maintain consistency)
        if user_role == "patient":
            cache = load_cache()
            cached_response = cache["get_chat"](request.message)
            
            if cached_response:
                logger.info(f"Cache HIT for: {request.message[:30]}...")
                return ChatResponse(
                    status="success",
                    session_id=session_id,
                    response=cached_response,
                    timestamp=get_timestamp(),
                    cached=True
                )
        
        # Load agent
        agent = load_agent()
        
        # Run agent and collect full response
        logger.info(f"Processing chat ({user_role}): {request.message[:50]}...")
        
        full_response = ""
        async for chunk in agent["stream"](request.message, patient_id=request.patient_id, user_role=user_role):
            full_response += chunk
        
        import re
        if not full_response:
            full_response = "I apologize, I couldn't process your request. Please try again." if user_role == "doctor" else "عذراً، مقدرتش أرد دلوقتي. جرب تاني."
        
        # Clean up <think> blocks and HTML tags for all frontends
        full_response = re.sub(r'<think>[\s\S]*?(?:</think>|$)', '', full_response).strip()
        full_response = re.sub(r'<br\s*/?>', '\n', full_response)
        
        # Cache the response (only for patient mode)
        if user_role == "patient":
            cache = load_cache()
            cache["set_chat"](request.message, full_response)
        
        logger.info(f"Chat response generated ({user_role}): {len(full_response)} chars")
        
        return ChatResponse(
            status="success",
            session_id=session_id,
            response=full_response,
            timestamp=get_timestamp(),
            cached=False
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"حصل خطأ: {str(e)}"
        )


@router.post("/stream", summary="Stream Chat with AI Assistant (SSE)")
async def chat_stream(request: ChatRequest):
    """
    SSE streaming chat endpoint.
    Yields real-time tokens from the agent via text/event-stream.
    """
    import re
    try:
        from src.stream_utils import make_metadata_event, make_text_event, make_done_event, sanitize_chunk, stream_text_chunks
    except ImportError:
        from stream_utils import make_metadata_event, make_text_event, make_done_event, sanitize_chunk, stream_text_chunks

    session_id = request.session_id or generate_session_id()
    user_role = request.user_role.lower() if request.user_role else "patient"

    if not request.message or not request.message.strip():
        error_msg = "Message cannot be empty." if user_role == "doctor" else "الرسالة فاضية. اكتب سؤالك من فضلك."
        raise HTTPException(status_code=400, detail=error_msg)

    # Cache check (patient only)
    if user_role == "patient":
        cache = load_cache()
        cached_response = cache["get_chat"](request.message)
        if cached_response:
            logger.info(f"SSE Cache HIT for: {request.message[:30]}...")

            async def cached_generator():
                yield make_metadata_event(label="chatbot", confidence=1.0, model="mediscan-agent")
                async for chunk in stream_text_chunks(cached_response):
                    yield chunk

            return StreamingResponse(
                cached_generator(),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
            )

    # Live streaming from agent
    agent = load_agent()

    async def live_generator():
        yield make_metadata_event(label="chatbot", confidence=1.0, model="mediscan-agent")
        full_response_parts = []
        in_think_block = False
        think_seen = False
        try:
            async for chunk in agent["stream"](request.message, patient_id=request.patient_id, user_role=user_role):
                if not chunk:
                    continue
                # Handle <think> blocks
                if not think_seen:
                    if "<think>" in chunk:
                        in_think_block = True
                        continue
                    if in_think_block:
                        if "</think>" in chunk:
                            in_think_block = False
                            think_seen = True
                            after = chunk.split("</think>", 1)[1]
                            if after.strip():
                                clean = sanitize_chunk(after)
                                if clean:
                                    full_response_parts.append(clean)
                                    yield make_text_event(clean)
                        continue

                clean = sanitize_chunk(chunk)
                if clean:
                    full_response_parts.append(clean)
                    yield make_text_event(clean)

        except Exception as e:
            logger.error(f"Agent streaming error: {e}")
            fallback = "I apologize, something went wrong." if user_role == "doctor" else "عذراً، حصلت مشكلة. جرب تاني."
            yield make_text_event(fallback)

        yield make_done_event()

        # Cache the assembled response
        if user_role == "patient" and full_response_parts:
            try:
                cache = load_cache()
                cache["set_chat"](request.message, "".join(full_response_parts))
            except Exception:
                pass

    return StreamingResponse(
        live_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
    )


@router.post("/clear-session", summary="Clear Chat Session")
async def clear_session(request: ClearSessionRequest):
    """
    مسح ذاكرة المحادثة.
    
    - **session_id**: معرف الجلسة
    """
    try:
        # Load agent and clear memory
        agent = load_agent()
        agent["clear"]()
        
        logger.info(f"Session cleared: {request.session_id}")
        
        return {
            "status": "success",
            "message": "تم مسح المحادثة بنجاح",
            "session_id": request.session_id,
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Clear session error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"حصل خطأ: {str(e)}"
        )
