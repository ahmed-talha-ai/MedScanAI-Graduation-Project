"""
MediScan - Data Loaders Module
يحمّل: ملفات PDF، Word، صور، CSVs
"""

import pandas as pd
from pathlib import Path
from typing import List
from langchain.schema import Document
import logging
from langchain_community.document_loaders import PyPDFLoader

logger = logging.getLogger(__name__)

try:
    from config import COMPANY_INFO_DIR
except ImportError:
    logger.warning("COMPANY_INFO_DIR not found")
    COMPANY_INFO_DIR = Path("./data/raw_company_info")

def load_faq_documents(faq_path: Path = Path(COMPANY_INFO_DIR) / "FAQ.csv") -> List[Document]:
    """تحميل الأسئلة الشائعة من CSV"""
    try:
        if not faq_path.exists():
            raise FileNotFoundError(f"FAQ not found: {faq_path}")
            
        df = pd.read_csv(faq_path)
        
        required_cols = ['Question', 'Answer']
        if not all(col in df.columns for col in required_cols):
            raise ValueError(f"CSV must contain: {required_cols}")
            
        documents = []
        for idx, row in df.iterrows():
            content = f"سؤال: {row.get('Question', '')}\nإجابة: {row.get('Answer', '')}"
            
            doc = Document(
                page_content=content,
                metadata={
                    "source": "mediscan_faq",
                    "type": "faq",
                    "doc_id": f"faq_{idx}",
                    "filename": faq_path.name
                }
            )
            documents.append(doc)
            
        logger.info(f"✅ Loaded {len(documents)} FAQ documents")
        return documents
        
    except Exception as e:
        logger.error(f"❌ Error loading FAQ: {str(e)}")
        raise

def load_company_info(info_path: Path = Path(COMPANY_INFO_DIR) / "info.md") -> Document:
    """تحميل معلومات المجمع من Markdown"""
    try:
        if not info_path.exists():
            raise FileNotFoundError(f"Info file not found: {info_path}")
            
        with open(info_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        doc = Document(
            page_content=content,
            metadata={
                "source": "mediscan_info",
                "type": "company_info",
                "filename": info_path.name,
                "doc_id": "company_info_main"
            }
        )
        logger.info(f"✅ Loaded company info from {info_path.name}")
        return doc
        
    except Exception as e:
        logger.error(f"❌ Error loading company info: {str(e)}")
        raise

def load_pdf_document(file_path: Path) -> List[Document]:
    """تحميل PDF باستخدام PyPDFLoader"""
    documents = []
    try:
        if not file_path.exists():
            raise FileNotFoundError(f"PDF not found: {file_path}")
        
        loader = PyPDFLoader(str(file_path))
        docs = loader.load()

        for doc in docs:
            doc.metadata["source"] = "uploaded_file"
            doc.metadata["type"] = "pdf"
            doc.metadata["filename"] = file_path.name
            page_num = doc.metadata.get("page", 0)
            doc.metadata["doc_id"] = f"{file_path.stem}_page_{page_num + 1}"

        documents.extend(docs)
        logger.info(f"✅ Loaded {len(documents)} pages from PDF: {file_path.name}")
        return documents
        
    except Exception as e:
        logger.error(f"❌ Error loading PDF {file_path.name}: {str(e)}")
        raise

def load_txt_document(file_path: Path) -> Document:
    """تحميل ملف نصي"""
    try:
        if not file_path.exists():
            raise FileNotFoundError(f"TXT not found: {file_path}")

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        doc = Document(
            page_content=content,
            metadata={
                "source": "uploaded_file",
                "type": "txt",
                "filename": file_path.name,
                "doc_id": file_path.stem
            }
        )
        logger.info(f"✅ Loaded TXT: {file_path.name}")
        return doc
        
    except Exception as e:
        logger.error(f"❌ Error loading TXT {file_path.name}: {str(e)}")
        raise

def process_uploaded_file(file_path: Path) -> List[Document]:
    """معالجة الملف المرفوع حسب نوعه"""
    documents = []
    try:
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        extension = file_path.suffix.lower()

        if extension == '.pdf':
            documents = load_pdf_document(file_path)
        elif extension == '.txt':
            documents = [load_txt_document(file_path)]
        else:
            logger.warning(f"⚠️ Unsupported file type: {extension}")
            return []
            
    except Exception as e:
        logger.error(f"❌ Error processing file {file_path.name}: {str(e)}")
    
    return documents


def load_medical_reference_documents() -> List[Document]:
    """
    تحميل وثائق المرجع الطبي مع تحليل ذكي للأقسام
    RAG Best Practice: Section-aware loading with rich metadata
    """
    try:
        from config import RAG_DOCUMENTS_DIR
    except ImportError:
        RAG_DOCUMENTS_DIR = Path("./data/rag_documents")
    
    documents = []
    medical_ref_path = Path(RAG_DOCUMENTS_DIR) / "medical_reference_arabic.txt"
    
    if not medical_ref_path.exists():
        logger.warning(f"⚠️ Medical reference file not found: {medical_ref_path}")
        return documents
    
    try:
        with open(medical_ref_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split by major sections (=== delimiters)
        major_sections = content.split("=" * 80)
        
        section_count = 0
        current_category = "عام"
        
        for section in major_sections:
            section = section.strip()
            if not section or len(section) < 50:
                continue
            
            # Extract section title (line with emoji or between === lines)
            lines = section.split('\n')
            section_title = "قسم طبي"
            
            for line in lines[:5]:  # Check first 5 lines for title
                line = line.strip()
                if line and not line.startswith('#') and not line.startswith('='):
                    if any(emoji in line for emoji in ['📊', '🩸', '💊', '🧪', '🫀', '📷', '🥗', '🩺', '🚨', '📋', '👁️', '👂', '🧴', '🧠', '🤰', '👩', '🆘', '❤️', '💉', '🦴']):
                        section_title = line.strip()
                        # Extract category from emoji
                        if '📊' in line or '🩸' in line:
                            current_category = "تحاليل"
                        elif '💊' in line or '🏥' in line:
                            current_category = "أمراض"
                        elif '👁️' in line:
                            current_category = "عيون"
                        elif '👂' in line:
                            current_category = "أنف وأذن"
                        elif '🧴' in line:
                            current_category = "جلدية"
                        elif '🧠' in line:
                            current_category = "صحة نفسية"
                        elif '🤰' in line or '👩' in line:
                            current_category = "صحة المرأة"
                        elif '🆘' in line or '🚨' in line:
                            current_category = "طوارئ"
                        elif '❤️' in line or '🫀' in line:
                            current_category = "قلب"
                        break
            
            # Extract keywords from the section
            keywords = []
            for line in lines:
                if "الكلمات المفتاحية:" in line or "الكلمات المفتاحية :" in line:
                    kw_text = line.split(":", 1)[-1].strip()
                    keywords.extend([k.strip() for k in kw_text.split("،") if k.strip()])
                    keywords.extend([k.strip() for k in kw_text.split(",") if k.strip()])
            
            # Create document with rich metadata
            doc = Document(
                page_content=section,
                metadata={
                    "source": "medical_reference_arabic",
                    "type": "medical_reference",
                    "section_title": section_title,
                    "category": current_category,
                    "keywords": ", ".join(keywords[:10]) if keywords else "",
                    "doc_id": f"medical_ref_{section_count}",
                    "filename": medical_ref_path.name,
                    "language": "ar-EG"  # Egyptian Arabic
                }
            )
            documents.append(doc)
            section_count += 1
        
        logger.info(f"✅ Loaded {len(documents)} medical reference sections")
        return documents
        
    except Exception as e:
        logger.error(f"❌ Error loading medical reference: {str(e)}")
        return []