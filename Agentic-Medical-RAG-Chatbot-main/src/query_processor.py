# ============================================================================
# query_processor.py - معالج الاستعلامات للـ RAG
# ============================================================================

"""
MediScan - Query Processing Module
RAG Best Practices Implementation:
- Multi-query expansion (highest ROI improvement)
- Arabic text normalization
- Query classification
- Stopword removal

Based on RAG Cheatsheet: Multi-query generation is the highest ROI improvement.
LLM generates semantic + keyword variations, covering more search surface.
"""

import re
import logging
from typing import List, Optional, Tuple

logger = logging.getLogger(__name__)


# ============================================================================
# ARABIC TEXT NORMALIZATION
# ============================================================================

# Arabic diacritics (tashkeel) to remove
ARABIC_DIACRITICS = re.compile(r'[\u064B-\u065F\u0670]')

# Arabic letter normalization map
ARABIC_NORMALIZE_MAP = {
    'أ': 'ا', 'إ': 'ا', 'آ': 'ا',  # Alef variants
    'ة': 'ه',  # Ta marbuta to Ha
    'ى': 'ي',  # Alef maksura to Ya
    'ؤ': 'و',  # Waw with hamza
    'ئ': 'ي',  # Ya with hamza
}

# Arabic medical stopwords
ARABIC_STOPWORDS = {
    'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
    'التي', 'الذي', 'هو', 'هي', 'هم', 'هن', 'أنا', 'نحن', 'أنت', 'أنتم',
    'كان', 'كانت', 'يكون', 'تكون', 'قد', 'لقد', 'ما', 'ماذا', 'لماذا',
    'كيف', 'متى', 'أين', 'هل', 'لا', 'نعم', 'أو', 'و', 'ثم', 'أن', 'إن',
    'عند', 'بعد', 'قبل', 'فوق', 'تحت', 'بين', 'حول', 'خلال', 'منذ',
    'كل', 'بعض', 'أي', 'كثير', 'قليل', 'أكثر', 'أقل', 'جدا', 'فقط',
    'ايه', 'ده', 'دي', 'اللي', 'عايز', 'عايزة', 'كده', 'ليه', 'ازاي',
}

# Egyptian Arabic to Modern Standard Arabic mapping
EGYPTIAN_TO_MSA = {
    'ايه': 'ما',
    'ده': 'هذا',
    'دي': 'هذه',
    'اللي': 'الذي',
    'عايز': 'أريد',
    'عايزة': 'أريد',
    'كتير': 'كثير',
    'صغير': 'قليل',
    'ازاي': 'كيف',
    'ليه': 'لماذا',
    'فين': 'أين',
    'امتى': 'متى',
    'كده': 'هكذا',
    'بس': 'فقط',
    'دلوقتي': 'الآن',
    'بتاع': 'خاص بـ',
    'بتاعة': 'خاصة بـ',
    'حاجة': 'شيء',
    'مش': 'ليس',
    'معايا': 'معي',
    'عندي': 'لدي',
}


def normalize_arabic(text: str) -> str:
    """
    Normalize Arabic text for better retrieval.
    - Remove diacritics
    - Normalize letter variants
    - Convert Egyptian to MSA if applicable
    """
    if not text:
        return ""
    
    # Remove diacritics
    text = ARABIC_DIACRITICS.sub('', text)
    
    # Normalize letter variants
    for old, new in ARABIC_NORMALIZE_MAP.items():
        text = text.replace(old, new)
    
    return text.strip()


def egypt_to_msa(text: str) -> str:
    """Convert Egyptian Arabic terms to Modern Standard Arabic."""
    words = text.split()
    result = []
    for word in words:
        normalized = EGYPTIAN_TO_MSA.get(word.lower(), word)
        result.append(normalized)
    return ' '.join(result)


def remove_stopwords(text: str) -> str:
    """Remove Arabic stopwords from text."""
    words = text.split()
    filtered = [w for w in words if w.lower() not in ARABIC_STOPWORDS]
    return ' '.join(filtered)


def preprocess_query(query: str) -> str:
    """
    Full query preprocessing pipeline.
    """
    # Step 1: Normalize Arabic
    query = normalize_arabic(query)
    
    # Step 2: Convert Egyptian to MSA
    query = egypt_to_msa(query)
    
    return query.strip()


# ============================================================================
# MULTI-QUERY EXPANSION (Highest ROI Improvement)
# ============================================================================

# Medical synonyms map for Arabic
MEDICAL_SYNONYMS = {
    'السكر': ['السكري', 'الديابيتس', 'مرض السكر', 'سكر الدم', 'الجلوكوز'],
    'الضغط': ['ضغط الدم', 'الضغط العالي', 'ارتفاع الضغط', 'هايبرتنشن'],
    'القلب': ['عضلة القلب', 'امراض القلب', 'قصور القلب', 'الشرايين'],
    'الكلى': ['الكليتين', 'فشل كلوي', 'امراض الكلى', 'غسيل كلوي'],
    'الكبد': ['التهاب الكبد', 'تليف الكبد', 'امراض الكبد', 'الصفراء'],
    'صداع': ['وجع الراس', 'الم الراس', 'صداع نصفي', 'شقيقة', 'ميجرين'],
    'حساسية': ['تحسس', 'حساسية دوائية', 'رد فعل تحسسي', 'التهاب'],
    'انيميا': ['فقر الدم', 'نقص الحديد', 'الهيموجلوبين', 'كرات الدم'],
    'تحليل': ['تحاليل', 'فحص', 'نتائج', 'معمل', 'اختبار'],
    'دواء': ['علاج', 'ادوية', 'عقار', 'وصفة', 'جرعة'],
    'اشعة': ['رنين', 'سونار', 'اكس راي', 'مقطعية', 'تصوير'],
    'سرطان': ['ورم', 'اورام', 'خلايا سرطانية', 'كيماوي'],
    'حمل': ['الحامل', 'جنين', 'ولادة', 'رضاعة'],
    'اطفال': ['طفل', 'رضيع', 'مولود', 'الاطفال'],
}


def expand_with_synonyms(query: str) -> List[str]:
    """
    Expand query with medical synonyms.
    Returns list of expanded queries.
    """
    queries = [query]  # Original query
    query_lower = query.lower()
    
    for term, synonyms in MEDICAL_SYNONYMS.items():
        if term in query_lower:
            for syn in synonyms[:2]:  # Max 2 synonyms per term
                expanded = query_lower.replace(term, syn)
                if expanded not in queries:
                    queries.append(expanded)
    
    return queries[:4]  # Max 4 queries


def generate_keyword_query(query: str) -> str:
    """
    Generate a keyword-focused version of the query.
    Removes stopwords and keeps medical terms.
    """
    # Preprocess
    processed = preprocess_query(query)
    
    # Remove stopwords
    keywords = remove_stopwords(processed)
    
    return keywords if keywords else query


def generate_semantic_query(query: str) -> str:
    """
    Generate a more natural/semantic version of the query.
    Useful for vector search.
    """
    # Add context prefix for medical queries
    medical_indicators = ['علاج', 'مرض', 'الم', 'دواء', 'تحليل', 'اعراض', 'سبب']
    
    for indicator in medical_indicators:
        if indicator in query:
            if not query.startswith('ما هو') and not query.startswith('ما هي'):
                return f"ما هو {query}"
    
    return query


def expand_query_multi(query: str, num_queries: int = 3) -> List[str]:
    """
    Generate multiple query variations for better retrieval coverage.
    RAG Best Practice: Multi-query generation is the highest ROI improvement.
    
    Args:
        query: Original user query
        num_queries: Number of variations to generate (default 3)
    
    Returns:
        List of query variations
    """
    queries = []
    
    # 1. Original (preprocessed)
    original = preprocess_query(query)
    queries.append(original)
    
    # 2. Keyword version (for BM25)
    keyword_query = generate_keyword_query(query)
    if keyword_query and keyword_query != original:
        queries.append(keyword_query)
    
    # 3. Semantic version (for vector search)
    semantic_query = generate_semantic_query(original)
    if semantic_query != original:
        queries.append(semantic_query)
    
    # 4. Synonym expansions
    synonym_queries = expand_with_synonyms(original)
    for sq in synonym_queries[1:]:  # Skip first (original)
        if sq not in queries:
            queries.append(sq)
    
    # Limit to requested number
    return queries[:num_queries]


# ============================================================================
# QUERY CLASSIFICATION
# ============================================================================

def classify_query(query: str) -> Tuple[str, float]:
    """
    Classify query type for routing.
    
    Returns:
        (query_type, confidence)
        Types: 'medical', 'general', 'greeting', 'out_of_scope'
    """
    query_lower = query.lower()
    
    # Greeting patterns
    greetings = ['مرحبا', 'السلام', 'صباح', 'مساء', 'ازيك', 'اهلا', 'هاي']
    if any(g in query_lower for g in greetings) and len(query_lower) < 30:
        return ('greeting', 0.9)
    
    # Medical indicators
    medical_terms = [
        'علاج', 'مرض', 'دواء', 'الم', 'صداع', 'تحليل', 'اشعة', 'طبيب',
        'دكتور', 'مستشفى', 'عيادة', 'جرعة', 'اعراض', 'تشخيص', 'فحص',
        'ضغط', 'سكر', 'قلب', 'كلى', 'كبد', 'معدة', 'حساسية', 'انيميا',
        'حمل', 'رضاعة', 'اطفال', 'كورونا', 'لقاح', 'فيتامين', 'مضاد',
    ]
    
    medical_count = sum(1 for term in medical_terms if term in query_lower)
    
    if medical_count >= 2:
        return ('medical', 0.95)
    elif medical_count == 1:
        return ('medical', 0.75)
    
    # General questions
    if len(query_lower) > 10:
        return ('general', 0.6)
    
    return ('out_of_scope', 0.5)


# ============================================================================
# MAIN INTERFACE
# ============================================================================

def process_query(query: str, expand: bool = True) -> dict:
    """
    Full query processing pipeline.
    
    Args:
        query: User's original query
        expand: Whether to generate multiple query variations
    
    Returns:
        dict with:
        - original: Original query
        - processed: Normalized query
        - queries: List of query variations (if expand=True)
        - query_type: Classification result
        - keywords: Extracted keywords
    """
    # Preprocess
    processed = preprocess_query(query)
    
    # Classify
    query_type, confidence = classify_query(query)
    
    # Generate variations if requested
    queries = expand_query_multi(query) if expand else [processed]
    
    # Extract keywords
    keywords = remove_stopwords(processed)
    
    result = {
        'original': query,
        'processed': processed,
        'queries': queries,
        'query_type': query_type,
        'confidence': confidence,
        'keywords': keywords,
    }
    
    logger.info(f"📝 Query processed: {query[:50]}... -> {len(queries)} variations")
    logger.debug(f"   Type: {query_type} ({confidence:.0%})")
    
    return result


# Quick test
if __name__ == "__main__":
    test_queries = [
        "ايه علاج السكر",
        "عندي صداع ووجع في راسي",
        "تحليل CBC",
        "مرحبا",
    ]
    
    for q in test_queries:
        result = process_query(q)
        print(f"\nOriginal: {q}")
        print(f"Processed: {result['processed']}")
        print(f"Queries: {result['queries']}")
        print(f"Type: {result['query_type']} ({result['confidence']:.0%})")
