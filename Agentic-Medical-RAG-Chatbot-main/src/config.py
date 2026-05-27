"""
MediScan Medical Center - Configuration Module (UPDATED)

Changes:
- Added best free models from OpenRouter, Groq, HuggingFace
- Improved model rotation strategy
- Added multiple vision models for image analysis
- Enhanced fallback logic
"""

import os
from pathlib import Path
from langchain_huggingface import HuggingFaceEmbeddings, HuggingFaceEndpoint
from dotenv import load_dotenv
import logging

# Initialize environment
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# FILE PATH CONFIGURATION (Cross-platform compatible)
# ============================================================================

PROJECT_ROOT = Path(__file__).parent.parent.absolute()
DATA_DIR = PROJECT_ROOT / "data"
COMPANY_INFO_DIR = DATA_DIR / "raw_company_info"
PROCESSED_DIR = DATA_DIR / "processed"
CHUNKS_PATH = PROCESSED_DIR / "company_chunks.pkl"
VECTOR_STORE_DIR = PROCESSED_DIR / "vector_store"
TEMP_UPLOAD_DIR = DATA_DIR / "temp_uploads"
UPLOADED_IMAGES_DIR = DATA_DIR / "uploaded_images"

# Ensure directories exist
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
COMPANY_INFO_DIR.mkdir(parents=True, exist_ok=True)
TEMP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
UPLOADED_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================================
# RAG CONFIGURATION - Best Practices for Medical Retrieval
# ============================================================================

# Medical reference documents directory
RAG_DOCUMENTS_DIR = DATA_DIR / "rag_documents"
RAG_DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)

# Chunking settings for medical content (smaller for precision)
MEDICAL_CHUNK_SIZE = 800  # Smaller chunks for precise medical answers
MEDICAL_CHUNK_OVERLAP = 150  # Overlap to maintain context

# Retrieval settings
RETRIEVAL_VECTOR_K = 8  # Number of vector search results
RETRIEVAL_BM25_K = 5  # Number of BM25 results
HYBRID_VECTOR_WEIGHT = 0.6  # Semantic search weight
HYBRID_BM25_WEIGHT = 0.4  # Keyword search weight (higher for Arabic medical terms)
RELEVANCE_THRESHOLD = 0.3  # Minimum similarity score to include result

# ============================================================================
# RAG ENHANCEMENT - New Best Practices (from Cheatsheet)
# ============================================================================

# Multi-Query Settings (Highest ROI improvement)
MULTI_QUERY_ENABLED = True  # Enable multi-query expansion
MULTI_QUERY_COUNT = 3  # Number of query variations

# MMR Settings (Balance relevance + diversity)
MMR_ENABLED = True  # Enable Maximal Marginal Relevance
MMR_DIVERSITY_LAMBDA = 0.7  # 0.7 relevance, 0.3 diversity

# Semantic Cache Settings (50-70% cost savings)
SEMANTIC_CACHE_ENABLED = True  # Enable semantic caching
SEMANTIC_CACHE_THRESHOLD = 0.92  # Similarity threshold (high to avoid false positives)
SEMANTIC_CACHE_TTL = 3600  # Cache TTL in seconds (1 hour)
SEMANTIC_CACHE_MAX_SIZE = 1000  # Maximum cache entries

# Reranking Settings
RERANKER_ENABLED = True  # Enable reranking
RERANKER_TOP_N = 20  # Initial retrieval count before reranking



# ============================================================================
# API CONFIGURATION
# ============================================================================

HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not HUGGINGFACE_API_TOKEN:
    logger.error("HUGGINGFACE_API_TOKEN not found in .env file!")
    raise ValueError("Please set HUGGINGFACE_API_TOKEN in your .env file")

# ============================================================================
# LLM CONFIGURATION - Best Models with Fallback
# ============================================================================

def create_llm():
    """
    Create LLM with automatic failover and rate limiting.
    Priority: Gemini (Best) -> Groq (Fast) -> OpenRouter -> HuggingFace
    """
    try:
        from src.fallback_llm import FallbackAwareLLM
    except ImportError:
        from fallback_llm import FallbackAwareLLM
    
    # Import rate limiter for logging
    try:
        from src.rate_limiter import quota_tracker
        logger.info("📊 Rate limiter loaded")
    except ImportError:
        try:
            from rate_limiter import quota_tracker
            logger.info("📊 Rate limiter loaded")
        except ImportError:
            pass
    
    models = []
    
    # 1. Google Gemini (TOP PRIORITY - Best Quality)
    try:
        if GEMINI_API_KEY:
            from langchain_google_genai import ChatGoogleGenerativeAI
            
            llm_gemini = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=GEMINI_API_KEY,
                temperature=0.1,
                max_output_tokens=3000,  # Reduced for faster responses
                request_timeout=25,
            )
            models.append(llm_gemini)
            logger.info("✅ Gemini 2.5 Flash added (Primary)")
    except Exception as e:
        logger.warning(f"Gemini init failed: {e}")
    
    # 2. Groq Models (FAST)
    try:
        from langchain_groq import ChatGroq
        
        if GROQ_API_KEY:
            llm_llama = ChatGroq(
                groq_api_key=GROQ_API_KEY,
                model_name="openai/gpt-oss-120b",
                temperature=0.1,
                max_tokens=3000,  # Reduced for faster responses
                request_timeout=25,
            )
            models.append(llm_llama)
            logger.info("✅ OpenAI 120B added")
    except Exception as e:
        logger.warning(f"Groq init failed: {e}")

    # 3. OpenRouter Models (BACKUP)
    try:
        from langchain_openai import ChatOpenAI
        
        if OPENROUTER_API_KEY:
            llm_or = ChatOpenAI(
                api_key=OPENROUTER_API_KEY,
                base_url="https://openrouter.ai/api/v1",
                model="google/gemini-flash-1.5",
                temperature=0.1,
                max_tokens=3000,  # Reduced for faster responses
                request_timeout=25,
            )
            models.append(llm_or)
            logger.info("✅ OpenRouter Gemini 2.0 Flash added")
    except Exception as e:
        logger.warning(f"OpenRouter init failed: {e}")

    # 3. HuggingFace Fallback (Using custom robust client)
    try:
        logger.info("Initializing HuggingFace fallback...")
        try:
            from src.hf_client import HuggingFaceHubChat
        except ImportError:
            from hf_client import HuggingFaceHubChat
        
        # Use Qwen 2.5 7B - Best 7B model for Medical/Arabic
        llm_hf = HuggingFaceHubChat(
            model_name="deepseek-ai/DeepSeek-V3.2",
            api_token=HUGGINGFACE_API_TOKEN,
            temperature=0.1,
            max_tokens=3000,  # Reduced for faster responses
        )
        models.append(llm_hf)
        logger.info("✅ DeepSeek V3.2 added (Best Medical/Arabic)")
    except Exception as e:
        logger.warning(f"HuggingFace initialization failed: {e}")

    if not models:
        logger.error("All LLM providers failed to initialize.")
        raise ValueError(
            "All LLM providers failed! Please check your API keys in .env for:\n"
            "1. OPENROUTER_API_KEY\n"
            "2. GROQ_API_KEY\n"
            "3. HUGGINGFACE_API_TOKEN"
        )
        
    logger.info(f"✅ Created FallbackAwareLLM with {len(models)} models")
    return FallbackAwareLLM(models=models)

LLM = create_llm()

# ============================================================================
# VISION MODEL CONFIGURATION - Prioritized per Research Recommendations
# ============================================================================

# Priority list of vision models (Gemini 2.0 Flash first for document understanding)
VISION_MODELS = [
    # 1. Gemini 2.0 Flash - BEST for Medical Reports (OCR-free PDF analysis)
    {
        "provider": "gemini",
        "model": "gemini-2.0-flash-exp",
        "name": "Gemini 2.0 Flash (Best for Medical Documents)",
        "supports": ["text", "image", "video", "pdf"],
        "max_images": 10,
        "primary": True
    },
    
    # 2. Groq Vision - Fast fallback
    {
        "provider": "groq",
        "model": "llama-3.2-90b-vision-preview",
        "name": "Llama 3.2 90B Vision (Groq - Fast)",
        "supports": ["text", "image"],
        "max_images": 5
    },
    {
        "provider": "groq", 
        "model": "llama-3.2-11b-vision-preview",
        "name": "Llama 3.2 11B Vision (Local-friendly)",
        "supports": ["text", "image"],
        "max_images": 5
    },
    
    # 3. OpenRouter FREE Vision Models
    {
        "provider": "openrouter",
        "model": "google/gemini-2.0-flash-exp:free",
        "name": "Gemini 2.0 Flash via OpenRouter (Free)",
        "supports": ["text", "image", "video"],
        "max_images": 10
    }
]

# Backward compatibility - Use Gemini for primary vision
VISION_MODEL = VISION_MODELS[0]["model"]

# ============================================================================
# EMBEDDING MODEL CONFIGURATION
# ============================================================================

def create_embedding_model():
    """
    Create embedding model with strong Arabic support for medical RAG.
    Using BAAI/bge-m3 as recommended for best Arabic medical retrieval.
    Supports hybrid search (Dense + Sparse) for precise medical term matching.
    """
    try:
        logger.info("Loading BAAI/bge-m3 embedding model (Best for Arabic Medical)...")
        
        embeddings = HuggingFaceEmbeddings(
            model_name="BAAI/bge-m3",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        
        logger.info("✅ Embedding model loaded: BAAI/bge-m3 (Multilingual Medical)")
        return embeddings
        
    except Exception as e:
        logger.warning(f"Failed to load BAAI/bge-m3: {e}")
        logger.info("Falling back to multilingual-e5-large...")
        
        try:
            embeddings = HuggingFaceEmbeddings(
                model_name="intfloat/multilingual-e5-large",
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
            logger.info("✅ Fallback embedding model loaded: multilingual-e5-large")
            return embeddings
            
        except Exception as e2:
            logger.error(f"All embedding models failed: {e2}")
            raise

EMBEDDING_MODEL = create_embedding_model()

# ============================================================================
# MEDICAL IMAGE ANALYSIS SETTINGS
# ============================================================================

SUPPORTED_IMAGE_FORMATS = {
    'image': ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'],
    'document': ['.pdf'],
    'dicom': ['.dcm']
}

MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

IMAGE_MAX_SIZE = (1024, 1024)
IMAGE_QUALITY = 95

# ============================================================================
# MEDICAL SPECIALTIES CONFIGURATION
# ============================================================================

MEDICAL_SPECIALTIES = {
    'dermatology': {
        'name_ar': 'الأمراض الجلدية',
        'name_en': 'Dermatology',
        'doctors': [
            {'name': 'د. أحمد السيد', 'experience': 15},
            {'name': 'د. منى عبد الرحمن', 'experience': 12},
            {'name': 'د. ياسر محمود', 'experience': 18}
        ]
    },
    'neurology': {
        'name_ar': 'الأورام الدماغية والمخ والأعصاب',
        'name_en': 'Neurology & Brain Tumors',
        'doctors': [
            {'name': 'د. محمد فاروق', 'experience': 20},
            {'name': 'د. هبة الشافعي', 'experience': 14},
            {'name': 'د. عمرو حسن', 'experience': 16}
        ]
    },
    'pulmonology': {
        'name_ar': 'الأشعة الصدرية والجهاز التنفسي',
        'name_en': 'Pulmonology & Chest Radiology',
        'doctors': [
            {'name': 'د. خالد الدسوقي', 'experience': 17},
            {'name': 'د. نورهان أحمد', 'experience': 13},
            {'name': 'د. طارق إبراهيم', 'experience': 19}
        ]
    },
    'general': {
        'name_ar': 'الباطنة العامة',
        'name_en': 'General Medicine',
        'doctors': [{'name': 'د. سامي عبد العزيز', 'experience': 15}]
    },
    'cardiology': {
        'name_ar': 'القلب والأوعية الدموية',
        'name_en': 'Cardiology',
        'doctors': [{'name': 'د. وليد الشاذلي', 'experience': 16}]
    }
}

# ============================================================================
# EGYPTIAN EMERGENCY NUMBERS
# ============================================================================

EMERGENCY_NUMBERS = {
    'ambulance': '123',
    'police': '122',
    'fire': '180',
    'hotline': '16888'
}

# ============================================================================
# WORKING HOURS (Egypt Time - EEST)
# ============================================================================

WORKING_HOURS = {
    'sunday': {'start': '09:00', 'end': '22:00'},
    'monday': {'start': '09:00', 'end': '22:00'},
    'tuesday': {'start': '09:00', 'end': '22:00'},
    'wednesday': {'start': '09:00', 'end': '22:00'},
    'thursday': {'start': '09:00', 'end': '22:00'},
    'friday': {'start': '14:00', 'end': '20:00'},
    'saturday': {'start': None, 'end': None}  # Closed
}

# ============================================================================
# CONFIGURATION VALIDATION
# ============================================================================

def validate_config():
    """Validate all required configurations"""
    required_vars = ["HUGGINGFACE_API_TOKEN"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {missing_vars}")
    
    if not COMPANY_INFO_DIR.exists():
        logger.warning(f"Company info directory not found: {COMPANY_INFO_DIR}")
        COMPANY_INFO_DIR.mkdir(parents=True, exist_ok=True)
    
    logger.info("✅ Configuration validation completed")

# Run validation on import
try:
    validate_config()
except Exception as e:
    logger.error(f"Configuration validation failed: {e}")
    raise

logger.info("=" * 60)
logger.info("🏥 MediScan Medical Center - Configuration Loaded")
logger.info(f"📍 Project Root: {PROJECT_ROOT}")
logger.info(f"📁 Data Directory: {DATA_DIR}")
logger.info(f"🤖 LLM Pool: {len(LLM.models)} models")
logger.info(f"👁️ Vision Models: {len(VISION_MODELS)} available")
logger.info(f"🔍 Embeddings: BAAI/bge-m3")
logger.info("=" * 60)