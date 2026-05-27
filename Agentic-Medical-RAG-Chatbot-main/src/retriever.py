# ============================================================================
# retriever.py - نظام الاسترجاع المحسّن
# ============================================================================

"""
MediScan - Enhanced Retriever Module
RAG Best Practices Implementation:
- Hybrid retrieval (BM25 + Vector)
- Re-ranking by similarity score
- Relevance threshold filtering
- Optimized weights for Arabic medical content
"""

from utils import *
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever
from config import (
    logger, 
    RETRIEVAL_VECTOR_K, 
    RETRIEVAL_BM25_K,
    HYBRID_VECTOR_WEIGHT,
    HYBRID_BM25_WEIGHT,
    RELEVANCE_THRESHOLD
)

# تحميل أو إنشاء Vector Store
try:
    logger.info("🔄 Loading vector store...")
    vector_store = load_company_vector_store()
    if vector_store:
        logger.info("✅ Vector store loaded")
    else:
        logger.info("🔄 Creating new vector store (including medical reference)...")
        company_documents = create_company_documents()
        company_chunks = split_documents(company_documents)
        vector_store = create_company_vector_store(company_chunks)
        logger.info("✅ Vector store created")
except Exception as e:
    logger.error(f"❌ Vector store error: {str(e)}")
    raise

# تحميل أو إنشاء Chunks
try:
    logger.info("🔄 Loading chunks...")
    company_chunks = load_chunks()
    if company_chunks:
        logger.info(f"✅ Chunks loaded: {len(company_chunks)} chunks")
    else:
        logger.info("🔄 Creating new chunks...")
        company_documents = create_company_documents()
        company_chunks = split_documents(company_documents)
        save_chunks(company_chunks)
        logger.info(f"✅ Chunks created: {len(company_chunks)} chunks")
except Exception as e:
    logger.error(f"❌ Chunks error: {str(e)}")
    raise

# إنشاء Vector Retriever مع k محسن
logger.info(f"🔍 Creating vector retriever (k={RETRIEVAL_VECTOR_K})...")
vector_retriever = vector_store.as_retriever(
    search_type="similarity",
    search_kwargs={"k": RETRIEVAL_VECTOR_K}
)

# BM25 Retriever
logger.info(f"🔍 Creating BM25 retriever (k={RETRIEVAL_BM25_K})...")
bm25_retriever = BM25Retriever.from_documents(company_chunks)
bm25_retriever.k = RETRIEVAL_BM25_K

# Hybrid Retriever
logger.info(f"🔄 Creating hybrid retriever (BM25={HYBRID_BM25_WEIGHT}, Vector={HYBRID_VECTOR_WEIGHT})...")
hybrid_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[HYBRID_BM25_WEIGHT, HYBRID_VECTOR_WEIGHT]
)


# ============================================================================
# ENHANCED RETRIEVAL FUNCTIONS (RAG Best Practices)
# ============================================================================

def retrieve_with_multi_query(query: str, top_k: int = 10) -> list:
    """
    Retrieve using multi-query expansion.
    RAG Best Practice: Multi-query is the highest ROI improvement.
    
    Args:
        query: Original user query
        top_k: Total results to return
        
    Returns:
        list: Unique documents from all query variations
    """
    try:
        # Import query processor
        try:
            from query_processor import expand_query_multi, preprocess_query
        except ImportError:
            # Fallback: just use original query
            logger.warning("⚠️ Query processor not available, using single query")
            return hybrid_retriever.invoke(query)[:top_k]
        
        # Generate query variations
        queries = expand_query_multi(query, num_queries=3)
        logger.info(f"🔄 Multi-query: {len(queries)} variations for '{query[:30]}...'")
        
        # Collect results from all queries
        all_results = []
        seen_contents = set()
        
        for q in queries:
            results = hybrid_retriever.invoke(q)
            for doc in results:
                # Deduplicate by content hash
                content_hash = hash(doc.page_content[:200])
                if content_hash not in seen_contents:
                    seen_contents.add(content_hash)
                    all_results.append(doc)
        
        logger.info(f"📊 Multi-query retrieved: {len(all_results)} unique docs")
        return all_results[:top_k * 2]  # Return more for reranking
        
    except Exception as e:
        logger.error(f"❌ Multi-query error: {e}")
        return hybrid_retriever.invoke(query)


def apply_mmr(docs: list, query: str, k: int = 5, lambda_param: float = 0.7) -> list:
    """
    Apply Maximal Marginal Relevance for diversity.
    RAG Best Practice: Balance relevance with diversity.
    
    MMR = λ × sim(q, d) - (1-λ) × max(sim(d, d_selected))
    
    Args:
        docs: List of documents
        query: Original query
        k: Number of results to return
        lambda_param: Balance (1.0 = pure relevance, 0.0 = pure diversity)
        
    Returns:
        list: Diverse and relevant documents
    """
    if len(docs) <= k:
        return docs
    
    try:
        # Import embeddings
        from utils import company_embeddings
        
        # Get query embedding
        query_embedding = company_embeddings.embed_query(query)
        
        # Get document embeddings
        doc_embeddings = []
        for doc in docs:
            emb = company_embeddings.embed_query(doc.page_content[:500])
            doc_embeddings.append(emb)
        
        # Calculate similarity helper
        def cosine_sim(a, b):
            dot = sum(x * y for x, y in zip(a, b))
            norm_a = sum(x * x for x in a) ** 0.5
            norm_b = sum(x * x for x in b) ** 0.5
            return dot / (norm_a * norm_b) if norm_a and norm_b else 0
        
        # Query-document similarities
        query_sims = [cosine_sim(query_embedding, emb) for emb in doc_embeddings]
        
        # MMR selection
        selected = []
        remaining = list(range(len(docs)))
        
        while len(selected) < k and remaining:
            best_idx = -1
            best_score = -float('inf')
            
            for idx in remaining:
                # Relevance term
                relevance = query_sims[idx]
                
                # Diversity term (max similarity to already selected)
                if selected:
                    max_sim_to_selected = max(
                        cosine_sim(doc_embeddings[idx], doc_embeddings[s])
                        for s in selected
                    )
                else:
                    max_sim_to_selected = 0
                
                # MMR score
                mmr_score = lambda_param * relevance - (1 - lambda_param) * max_sim_to_selected
                
                if mmr_score > best_score:
                    best_score = mmr_score
                    best_idx = idx
            
            if best_idx >= 0:
                selected.append(best_idx)
                remaining.remove(best_idx)
        
        logger.info(f"🎯 MMR selected {len(selected)} diverse docs (λ={lambda_param})")
        return [docs[i] for i in selected]
        
    except Exception as e:
        logger.warning(f"⚠️ MMR failed, returning top docs: {e}")
        return docs[:k]


def retrieve_with_reranking(query: str, top_k: int = 5) -> list:
    """
    استرجاع محسن مع Multi-Query + Reranking + MMR
    RAG Best Practices: 
    - Multi-query expansion (highest ROI)
    - Re-rank by relevance
    - MMR for diversity
    
    Args:
        query: استعلام البحث
        top_k: عدد النتائج المطلوبة
        
    Returns:
        list: قائمة النتائج المرتبة حسب الأهمية
    """
    try:
        # Step 1: Multi-query retrieval
        results = retrieve_with_multi_query(query, top_k=top_k * 3)
        
        if not results:
            logger.warning(f"⚠️ No results found for: {query[:50]}...")
            return []
        
        # Step 2: Score and rerank
        scored_results = []
        for doc in results:
            content_lower = doc.page_content.lower()
            query_terms = query.split()
            
            # Calculate relevance score
            matches = sum(1 for term in query_terms if term.lower() in content_lower)
            score = matches / len(query_terms) if query_terms else 0
            
            # Boost for medical reference docs
            if doc.metadata.get("type") == "medical_reference":
                score *= 1.3
            
            # Boost for section match
            subsection = doc.metadata.get("subsection", "").lower()
            if any(term.lower() in subsection for term in query_terms):
                score *= 1.2
            
            scored_results.append((doc, score))
        
        # Sort by score
        scored_results.sort(key=lambda x: x[1], reverse=True)
        
        # Filter by threshold
        filtered = [
            doc for doc, score in scored_results 
            if score >= RELEVANCE_THRESHOLD
        ]
        
        # Fallback if too few results
        if len(filtered) < 3:
            filtered = [doc for doc, _ in scored_results[:top_k * 2]]
        
        # Step 3: Apply MMR for diversity
        diverse_results = apply_mmr(filtered, query, k=top_k, lambda_param=0.7)
        
        logger.info(f"✅ Retrieved {len(diverse_results)} docs for: {query[:30]}...")
        return diverse_results
        
    except Exception as e:
        logger.error(f"❌ Retrieval error: {e}")
        return []


def get_relevant_context(query: str, max_chars: int = 4000) -> str:
    """
    استخراج السياق المناسب للاستعلام
    
    Args:
        query: استعلام البحث
        max_chars: الحد الأقصى للحروف
        
    Returns:
        str: النص المجمع من النتائج
    """
    results = retrieve_with_reranking(query)
    
    if not results:
        return ""
    
    context_parts = []
    total_chars = 0
    
    for doc in results:
        content = doc.page_content.strip()
        if total_chars + len(content) > max_chars:
            # Add partial if space available
            remaining = max_chars - total_chars
            if remaining > 200:
                context_parts.append(content[:remaining] + "...")
            break
        context_parts.append(content)
        total_chars += len(content)
    
    return "\n\n---\n\n".join(context_parts)


logger.info("=" * 60)
logger.info("✅ MediScan Enhanced Retriever v2.0 - Ready")
logger.info(f"📊 Total chunks: {len(company_chunks)}")
logger.info(f"🔍 Hybrid: BM25({HYBRID_BM25_WEIGHT}) + Vector({HYBRID_VECTOR_WEIGHT})")
logger.info(f"🎯 Multi-Query + MMR Diversity enabled")
logger.info(f"📈 Relevance threshold: {RELEVANCE_THRESHOLD}")
logger.info("=" * 60)