# ============================================================================
# utils.py - دوال مساعدة
# ============================================================================

"""
MediScan - Utility Functions
دوال عامة للمساعدة
"""

import pickle
import logging
from pathlib import Path
from typing import List, Optional
from langchain.schema import Document
from langchain_community.vectorstores import FAISS

from config import EMBEDDING_MODEL, VECTOR_STORE_DIR, CHUNKS_PATH
from data_loaders import load_company_info, load_faq_documents, load_medical_reference_documents
from text_processor import markdown_splitter, recursive_500, split_medical_reference

logger = logging.getLogger(__name__)

def load_company_vector_store() -> Optional[FAISS]:
    """تحميل قاعدة البيانات المتجهية"""
    try:
        if Path(VECTOR_STORE_DIR).exists():
            vector_store = FAISS.load_local(
                str(VECTOR_STORE_DIR),
                EMBEDDING_MODEL,
                allow_dangerous_deserialization=True
            )
            logger.info("✅ Vector store loaded")
            return vector_store
        else:
            logger.info("ℹ️ No existing vector store found")
            return None
    except Exception as e:
        logger.error(f"❌ Failed to load vector store: {e}")
        return None

def create_company_vector_store(documents: List[Document]) -> Optional[FAISS]:
    """إنشاء قاعدة بيانات متجهية"""
    if not documents:
        logger.error("❌ No documents provided")
        return None
        
    try:
        Path(VECTOR_STORE_DIR).mkdir(parents=True, exist_ok=True)
        
        vector_store = FAISS.from_documents(documents, EMBEDDING_MODEL)
        vector_store.save_local(str(VECTOR_STORE_DIR))
        logger.info(f"✅ Vector store created with {len(documents)} docs")
        return vector_store
    except Exception as e:
        logger.error(f"❌ Failed to create vector store: {e}")
        return None

def create_company_documents() -> List[Document]:
    """إنشاء وثائق الشركة والمرجع الطبي"""
    try:
        company_documents = []
        
        try:
            faq_docs = load_faq_documents()
            company_documents.extend(faq_docs)
            logger.info(f"✅ Loaded {len(faq_docs)} FAQ docs")
        except Exception as e:
            logger.error(f"❌ Failed to load FAQ: {e}")
        
        try:
            company_info = load_company_info()
            if company_info:
                company_documents.append(company_info)
                logger.info("✅ Loaded company info")
        except Exception as e:
            logger.error(f"❌ Failed to load company info: {e}")
        
        # Load medical reference documents (RAG Best Practice)
        try:
            medical_docs = load_medical_reference_documents()
            company_documents.extend(medical_docs)
            logger.info(f"✅ Loaded {len(medical_docs)} medical reference docs")
        except Exception as e:
            logger.error(f"❌ Failed to load medical reference: {e}")
        
        logger.info(f"📊 Total documents: {len(company_documents)}")
        return company_documents
        
    except Exception as e:
        logger.error(f"❌ Failed to create company documents: {e}")
        return []

def split_documents(company_documents: List[Document]) -> List[Document]:
    """تقسيم الوثائق لقطع صغيرة مع مراعاة نوع الوثيقة"""
    if not company_documents:
        logger.warning("⚠️ No documents to split")
        return []
        
    company_chunks = []
    
    try:
        for i, doc in enumerate(company_documents):
            try:
                doc_type = doc.metadata.get("type", "")
                
                if doc_type == "company_info":
                    # Use markdown splitter for company info
                    split_docs = markdown_splitter.split_text(doc.page_content)
                    for d in split_docs:
                        d.metadata.update(doc.metadata)
                    company_chunks.extend(split_docs)
                    
                elif doc_type == "medical_reference":
                    # Use specialized medical reference splitter (RAG Best Practice)
                    medical_chunks = split_medical_reference([doc])
                    company_chunks.extend(medical_chunks)
                    logger.info(f"📚 Split medical doc into {len(medical_chunks)} chunks")
                    
                else:
                    # Use standard splitter for FAQ and other docs
                    split_docs = recursive_500.split_documents([doc])
                    company_chunks.extend(split_docs)
                    
            except Exception as e:
                logger.error(f"❌ Failed to split doc {i}: {e}")
                continue
                
        logger.info(f"✅ Split {len(company_documents)} docs into {len(company_chunks)} chunks")
        return company_chunks
        
    except Exception as e:
        logger.error(f"❌ Failed to split documents: {e}")
        return []

def load_chunks() -> Optional[List[Document]]:
    """تحميل القطع المحفوظة"""
    try:
        if Path(CHUNKS_PATH).exists():
            with open(CHUNKS_PATH, 'rb') as f:
                company_chunks = pickle.load(f)
            logger.info(f"✅ Loaded {len(company_chunks)} chunks from cache")
            return company_chunks
        else:
            logger.info("ℹ️ No cached chunks found")
            return None
    except Exception as e:
        logger.error(f"❌ Failed to load chunks: {e}")
        return None

def save_chunks(chunks: List[Document]) -> bool:
    """حفظ القطع"""
    try:
        Path(CHUNKS_PATH).parent.mkdir(parents=True, exist_ok=True)
        
        with open(CHUNKS_PATH, 'wb') as f:
            pickle.dump(chunks, f)
        logger.info(f"✅ Saved {len(chunks)} chunks")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to save chunks: {e}")
        return False

def initialize_knowledge_base() -> Optional[FAISS]:
    """تهيئة قاعدة المعرفة الكاملة"""
    try:
        vector_store = load_company_vector_store()
        if vector_store:
            return vector_store
        
        logger.info("🔄 Creating new knowledge base...")
        
        chunks = load_chunks()
        if not chunks:
            logger.info("🔄 Processing documents...")
            documents = create_company_documents()
            if documents:
                chunks = split_documents(documents)
                if chunks:
                    save_chunks(chunks)
        
        if chunks:
            vector_store = create_company_vector_store(chunks)
            return vector_store
        else:
            logger.error("❌ No chunks available")
            return None
            
    except Exception as e:
        logger.error(f"❌ Failed to initialize knowledge base: {e}")
        return None