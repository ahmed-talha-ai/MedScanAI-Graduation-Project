# ============================================================================
# text_processor.py - معالج النصوص للمجال الطبي
# ============================================================================

"""
MediScan - Text Processing Module (Medical Optimized)
تقسيم النصوص الطبية بذكاء للحفاظ على السياق الكامل

Research-backed settings:
- Chunk Size: 1024 tokens (medical concepts need more context)
- Overlap: 200 tokens (prevents cutting critical info like negations)
- Arabic-aware separators (respects Arabic sentence structure)
"""

from langchain.text_splitter import RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter
from langchain.schema import Document

# =============================================================================
# مقسم النصوص الطبية المحسّن (Optimized Medical Text Splitter)
# =============================================================================
# Chunk size: 1024 (larger for medical context)
# Overlap: 200 (to catch "المريض لا يعاني..." type sentences)

medical_text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1024,
    chunk_overlap=200,
    length_function=len,
    separators=[
        "\n\n",     # Double newline (paragraphs)
        "\n",       # Single newline
        "---",      # Markdown horizontal rule
        ".",        # English period
        "。",       # Chinese period (if any)
        "،",        # Arabic comma
        "؛",        # Arabic semicolon
        "؟",        # Arabic question mark
        "!",        # Exclamation
        " ",        # Space (last resort)
    ]
)

# Backward compatibility alias
recursive_500 = medical_text_splitter

# =============================================================================
# مقسم ملفات Markdown (للتقارير المهيكلة)
# =============================================================================
markdown_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=[
        ("#", "title"),
        ("##", "section"),
        ("###", "subsection"),
        ("####", "detail")
    ]
)

# =============================================================================
# Section-Aware Medical Reference Splitter (للملف الطبي الكبير)
# =============================================================================
# Best Practice: Smaller chunks (800) for precise medical retrieval
# Respects --- delimiters to keep medical topics together

try:
    from config import MEDICAL_CHUNK_SIZE, MEDICAL_CHUNK_OVERLAP
except ImportError:
    MEDICAL_CHUNK_SIZE = 800
    MEDICAL_CHUNK_OVERLAP = 150

medical_reference_splitter = RecursiveCharacterTextSplitter(
    chunk_size=MEDICAL_CHUNK_SIZE,
    chunk_overlap=MEDICAL_CHUNK_OVERLAP,
    length_function=len,
    separators=[
        "\n---",      # Medical section delimiter (HIGHEST priority)
        "\n\n",       # Double newline (paragraphs)
        "\n",         # Single newline
        "---",        # Section delimiter
        ":",          # After labels like "الأعراض:"
        "،",          # Arabic comma
        "؛",          # Arabic semicolon
        "؟",          # Arabic question mark
        ".",          # English period
        " ",          # Space (last resort)
    ]
)


def split_medical_reference(documents):
    """
    تقسيم وثائق المرجع الطبي مع الحفاظ على السياق
    RAG Best Practice: Keep medical topics together
    """
    chunks = []
    for doc in documents:
        # First split by subsections (---)
        content = doc.page_content
        subsections = content.split("---")
        
        for i, subsection in enumerate(subsections):
            subsection = subsection.strip()
            if not subsection or len(subsection) < 30:
                continue
            
            # Extract subsection title if present
            lines = subsection.split('\n')
            subsection_title = ""
            for line in lines[:3]:
                if line.strip() and not line.startswith('-') and not line.startswith('*'):
                    subsection_title = line.strip()[:50]
                    break
            
            # If subsection is small enough, keep as one chunk
            if len(subsection) <= MEDICAL_CHUNK_SIZE:
                chunk_doc = Document(
                    page_content=subsection,
                    metadata={
                        **doc.metadata,
                        "chunk_id": f"{doc.metadata.get('doc_id', 'unknown')}_{i}",
                        "subsection": subsection_title
                    }
                )
                chunks.append(chunk_doc)
            else:
                # Split large subsections
                split_chunks = medical_reference_splitter.split_text(subsection)
                for j, chunk_text in enumerate(split_chunks):
                    chunk_doc = Document(
                        page_content=chunk_text,
                        metadata={
                            **doc.metadata,
                            "chunk_id": f"{doc.metadata.get('doc_id', 'unknown')}_{i}_{j}",
                            "subsection": subsection_title
                        }
                    )
                    chunks.append(chunk_doc)
    
    return chunks