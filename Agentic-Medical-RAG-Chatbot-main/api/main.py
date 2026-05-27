"""
MediScan Medical Center - FastAPI Backend
==========================================
Modular API for chatbot, medical image analysis, and patient management.

Endpoints:
- GET  /                - API info
- GET  /health          - Health check
- POST /chat            - Chat with the medical assistant
- POST /images/analyze  - Analyze medical image
- GET  /patient/{id}    - Patient management
- GET  /report/{id}     - AI-generated doctor reports

Usage:
    uvicorn api.main:app --reload --port 8000
    
Docs:
    http://localhost:8000/docs (Swagger UI)
"""

import os
import sys
import logging
from datetime import datetime
from typing import Dict, Any

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src'))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import routers
from .chat import router as chat_router
from .image_analysis import router as image_router
from .patient import router as patient_router
from .medical_report import router as report_router
from .models import HealthResponse

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="MediScan AI API",
    description="🏥 API للمساعد الطبي الذكي وتحليل الصور الطبية",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# LAZY LOADING
# ============================================================================

_cache_loaded = False
_cache_module = None
_security_loaded = False
_security_module = None


def load_cache() -> Dict[str, Any]:
    """Lazy load the cache module."""
    global _cache_loaded, _cache_module
    if not _cache_loaded:
        logger.info("🔄 Loading cache module...")
        from src.cache import get_all_cache_stats, clear_all_caches
        _cache_module = {
            "stats": get_all_cache_stats,
            "clear": clear_all_caches
        }
        _cache_loaded = True
        logger.info("✅ Cache module loaded")
    return _cache_module


def load_security() -> Dict[str, Any]:
    """Lazy load the security module."""
    global _security_loaded, _security_module
    if not _security_loaded:
        logger.info("🔄 Loading security module...")
        from src.security import SecurityManager, validate_api_key
        _security_module = {
            "manager": SecurityManager(),
            "validate_key": validate_api_key
        }
        _security_loaded = True
        logger.info("✅ Security module loaded")
    return _security_module


def get_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now().isoformat()


# ============================================================================
# MOUNT ROUTERS
# ============================================================================

app.include_router(chat_router, prefix="/chat", tags=["💬 Chat"])
app.include_router(image_router, prefix="/images", tags=["🖼️ Image Analysis"])
app.include_router(patient_router, prefix="/patient", tags=["👤 Patient Management"])
app.include_router(report_router, prefix="/report", tags=["📋 Doctor Reports"])


# ============================================================================
# ROOT & HEALTH ENDPOINTS
# ============================================================================

@app.get("/", tags=["General"])
async def root():
    """Root endpoint - API info."""
    return {
        "name": "MediScan AI API",
        "version": "2.0.0",
        "description": "🏥 API للمساعد الطبي الذكي وتحليل الصور الطبية",
        "endpoints": {
            "chat": "/chat - الدردشة مع المساعد الذكي",
            "images": "/images - تحليل الصور الطبية",
            "patient": "/patient - إدارة المرضى",
            "report": "/report - تقارير الطبيب",
            "docs": "/docs - توثيق API",
        },
        "status": "running",
        "timestamp": get_timestamp()
    }


@app.get("/health", response_model=HealthResponse, tags=["General"])
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        message="🏥 MediScan API is running",
        timestamp=get_timestamp()
    )


# ============================================================================
# CACHE MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/cache/stats", tags=["Cache"])
async def cache_stats():
    """
    الحصول على إحصائيات الـ Cache.
    """
    try:
        cache = load_cache()
        stats = cache["stats"]()
        return {
            "status": "success",
            **stats,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"Cache stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cache/clear", tags=["Cache"])
async def clear_cache():
    """
    مسح كل الـ Cache.
    """
    try:
        cache = load_cache()
        result = cache["clear"]()
        logger.info(f"Cache cleared: {result}")
        return {
            "status": "success",
            "message": "تم مسح الـ Cache بنجاح",
            **result,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"Cache clear error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# SECURITY ENDPOINTS
# ============================================================================

@app.get("/security/status", tags=["Security"])
async def get_security_status(request: Request):
    """
    الحصول على حالة الأمان والـ rate limit.
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        
        try:
            security = load_security()
            from src.security import rate_limiter
            
            ip_info = rate_limiter.get_ip_status(client_ip)
            
            return {
                "status": "success",
                "client_ip": client_ip,
                "security": {
                    "rate_limit_active": True,
                    "requests_remaining": ip_info.get("requests_remaining", "N/A"),
                    "reset_time": ip_info.get("reset_time", "N/A")
                },
                "timestamp": get_timestamp()
            }
        except Exception as sec_err:
            logger.warning(f"Security module not available: {sec_err}")
            return {
                "status": "success",
                "client_ip": client_ip,
                "security": {
                    "rate_limit_active": False,
                    "message": "Security module not configured"
                },
                "timestamp": get_timestamp()
            }
            
    except Exception as e:
        logger.error(f"Security status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/security/api-key", tags=["Security"])
async def get_api_key_info(request: Request):
    """
    معلومات عن الـ API Key المستخدم.
    """
    try:
        api_key = request.headers.get("X-API-Key")
        
        if not api_key:
            return {
                "status": "info",
                "message": "No API key provided",
                "hint": "Add X-API-Key header for authenticated access",
                "timestamp": get_timestamp()
            }
        
        try:
            security = load_security()
            is_valid = security["validate_key"](api_key)
            
            return {
                "status": "success" if is_valid else "invalid",
                "key_valid": is_valid,
                "key_preview": f"{api_key[:8]}...{api_key[-4:]}" if len(api_key) > 12 else "***",
                "timestamp": get_timestamp()
            }
        except Exception:
            return {
                "status": "info",
                "message": "API key validation not available",
                "timestamp": get_timestamp()
            }
            
    except Exception as e:
        logger.error(f"API key info error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "detail": exc.detail,
            "timestamp": get_timestamp()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler."""
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "detail": "حدث خطأ غير متوقع",
            "timestamp": get_timestamp()
        }
    )


# ============================================================================
# STARTUP & SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    logger.info("🚀 MediScan API v2.0 starting...")
    logger.info("📖 Docs: http://localhost:8000/docs")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("👋 MediScan API shutting down...")


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
