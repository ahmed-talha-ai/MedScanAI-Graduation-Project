"""
MediScan - PDF Report Generator
===============================
Generate professional PDF reports for medical analysis results.

Features:
- Arabic/English support with RTL handling
- Professional medical report layout
- MediScan branding
- Timestamps and metadata
"""

import os
import io
import re
import textwrap
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
import logging

# PDF Libraries
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Arabic RTL Support
try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    ARABIC_RTL_AVAILABLE = True
except ImportError:
    ARABIC_RTL_AVAILABLE = False

logger = logging.getLogger(__name__)


def reshape_arabic(text: str) -> str:
    """
    Reshape Arabic text for proper RTL display in PDFs.
    This fixes the reversed/mirrored text issue.
    """
    if not ARABIC_RTL_AVAILABLE:
        return text
    
    try:
        # Reshape connected Arabic letters
        reshaped = arabic_reshaper.reshape(text)
        # Apply BiDi algorithm for correct display order
        bidi_text = get_display(reshaped)
        
        # Remove Bidi control characters that might render as squares
        # U+200E (LRM), U+200F (RLM), U+202A (LRE), U+202B (RLE), U+202C (PDF), U+202D (LRO), U+202E (RLO)
        bidi_text = re.sub(r'[\u200e\u200f\u202a\u202b\u202c\u202d\u202e]', '', bidi_text)
        
        return bidi_text
    except Exception as e:
        logger.warning(f"Arabic reshape error: {e}")
        return text

# ============================================================================
# CONFIGURATION
# ============================================================================

# Colors - Premium Medical Color Palette
COLORS = {
    "primary": HexColor("#0D9488"),       # Teal 600 (Vibrant Teal)
    "primary_dark": HexColor("#0F766E"),  # Teal 700
    "primary_light": HexColor("#CCFBF1"), # Teal 100 (Soft Background)
    "secondary": HexColor("#3B82F6"),     # Blue 500 (Vibrant Blue)
    "secondary_light": HexColor("#DBEAFE"),# Blue 100
    "accent": HexColor("#8B5CF6"),        # Violet 500
    "warning": HexColor("#F59E0B"),       # Amber 500
    "warning_light": HexColor("#FEF3C7"), # Amber 100
    "danger": HexColor("#EF4444"),        # Red 500
    "danger_light": HexColor("#FEE2E2"),  # Red 100
    "info": HexColor("#0EA5E9"),          # Sky 500
    "info_light": HexColor("#E0F2FE"),    # Sky 100
    "dark": HexColor("#1E293B"),          # Slate 800
    "light": HexColor("#F8FAFC"),         # Slate 50
    "text": HexColor("#0F172A"),          # Slate 900
    "text_secondary": HexColor("#475569"),# Slate 600
    "muted": HexColor("#94A3B8"),         # Slate 400
    "border": HexColor("#CBD5E1"),        # Slate 300
    "white": HexColor("#FFFFFF"),
}

# Report directory
REPORTS_DIR = Path(__file__).parent.parent / "data" / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================================
# ARABIC FONT SETUP
# ============================================================================

def setup_arabic_fonts():
    """
    Setup Arabic fonts for PDF generation.
    Uses system fonts or falls back to default.
    """
    try:
        # Try common Arabic font paths (Windows)
        arabic_fonts = [
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/tahoma.ttf",
            "C:/Windows/Fonts/times.ttf",
        ]
        
        for font_path in arabic_fonts:
            if os.path.exists(font_path):
                pdfmetrics.registerFont(TTFont('Arabic', font_path))
                logger.info(f"✅ Registered Arabic font: {font_path}")
                return True
        
        logger.warning("⚠️ No Arabic font found, using default")
        return False
        
    except Exception as e:
        logger.warning(f"Font setup error: {e}")
        return False

# Initialize fonts
ARABIC_FONT_AVAILABLE = setup_arabic_fonts()

# ============================================================================
# REPORT GENERATOR CLASS
# ============================================================================

class MedicalReportGenerator:
    """Generate professional medical PDF reports."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_styles()
    
    def _setup_styles(self):
        """Setup custom paragraph styles."""
        # Title style
        self.styles.add(ParagraphStyle(
            name='ReportTitle',
            fontSize=22,  # Larger title
            leading=26,
            alignment=TA_CENTER,
            textColor=COLORS["primary"],
            fontName='Arabic' if ARABIC_FONT_AVAILABLE else 'Helvetica-Bold',
            spaceAfter=10,
        ))
        
        # Header style (Arabic RTL)
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            fontSize=14,  # Larger
            leading=18,
            alignment=TA_RIGHT,
            textColor=COLORS["primary_dark"],
            fontName='Arabic' if ARABIC_FONT_AVAILABLE else 'Helvetica-Bold',
            spaceBefore=10,
            spaceAfter=6,
        ))
        
        # Header style (English LTR) - Smaller for doctor reports
        self.styles.add(ParagraphStyle(
            name='SectionHeaderEnglish',
            fontSize=12,  # Smaller for dense clinical content
            leading=15,
            alignment=TA_LEFT,
            textColor=COLORS["primary_dark"],
            fontName='Helvetica-Bold',
            spaceBefore=8,
            spaceAfter=4,
        ))
        
        # Body text (RTL for Arabic)
        self.styles.add(ParagraphStyle(
            name='BodyArabic',
            fontSize=12,  # Larger text
            leading=16,
            alignment=TA_RIGHT,
            textColor=COLORS["text"],
            fontName='Arabic' if ARABIC_FONT_AVAILABLE else 'Helvetica',
            spaceAfter=4,
        ))
        
        # Body text (LTR for English) - Smaller for doctor reports
        self.styles.add(ParagraphStyle(
            name='BodyEnglish',
            fontSize=10,  # Smaller for dense clinical content
            leading=13,
            alignment=TA_LEFT,
            textColor=COLORS["text"],
            fontName='Helvetica',
            spaceAfter=3,
        ))
        
        # Footer style
        self.styles.add(ParagraphStyle(
            name='Footer',
            fontSize=9,
            leading=11,
            alignment=TA_CENTER,
            textColor=COLORS["muted"],
            fontName='Arabic' if ARABIC_FONT_AVAILABLE else 'Helvetica',
        ))
        
        # Main Header style (for ## headings) - English (Smaller)
        self.styles.add(ParagraphStyle(
            name='MainHeaderEnglish',
            fontSize=13,  # Smaller for doctor reports
            leading=17,
            alignment=TA_LEFT,
            textColor=COLORS["white"],
            fontName='Helvetica-Bold',
            spaceBefore=12,
            spaceAfter=6,
            backColor=COLORS["primary"],
            leftIndent=6,
            rightIndent=6,
            borderPadding=6,
        ))
        
        # Main Header style (for ## headings) - Arabic
        self.styles.add(ParagraphStyle(
            name='MainHeaderArabic',
            fontSize=15,
            leading=20,
            alignment=TA_RIGHT,
            textColor=COLORS["white"],
            fontName='Arabic' if ARABIC_FONT_AVAILABLE else 'Helvetica-Bold',
            spaceBefore=14,
            spaceAfter=8,
            backColor=COLORS["primary"],
            leftIndent=8,
            rightIndent=8,
            borderPadding=8,
        ))
        
        # SubHeader style (for bold sections) - English (Smaller)
        self.styles.add(ParagraphStyle(
            name='SubHeaderEnglish',
            fontSize=11,  # Smaller for doctor reports
            leading=14,
            alignment=TA_LEFT,
            textColor=COLORS["secondary"],
            fontName='Helvetica-Bold',
            spaceBefore=8,
            spaceAfter=4,
        ))
        
        # SubHeader style (for bold sections) - Arabic  
        self.styles.add(ParagraphStyle(
            name='SubHeaderArabic',
            fontSize=13,
            leading=16,
            alignment=TA_RIGHT,
            textColor=COLORS["secondary"],
            fontName='Arabic' if ARABIC_FONT_AVAILABLE else 'Helvetica-Bold',
            spaceBefore=10,
            spaceAfter=5,
        ))
        
        # Table Header style
        self.styles.add(ParagraphStyle(
            name='TableHeader',
            fontSize=11,  # Larger table header
            leading=14,
            alignment=TA_CENTER,
            textColor=COLORS["white"],
            fontName='Helvetica-Bold',
        ))
        
        # Table Cell style  
        self.styles.add(ParagraphStyle(
            name='TableCell',
            fontSize=10,  # Larger table cell
            leading=13,
            alignment=TA_LEFT,
            textColor=COLORS["text"],
            fontName='Helvetica',
        ))
    
    def _create_header(self) -> list:
        """Create report header with branding."""
        elements = []
        
        # Title
        title = Paragraph(
            reshape_arabic("MediScan AI - التقرير الطبي"),
            self.styles['ReportTitle']
        )
        elements.append(title)
        
        # Subtitle with date
        date_str = datetime.now().strftime("%Y/%m/%d - %H:%M")
        subtitle = Paragraph(
            reshape_arabic(f"تاريخ التقرير: {date_str}"),
            self.styles['Footer']
        )
        elements.append(subtitle)
        elements.append(Spacer(1, 5))
        
        # Divider line
        divider_data = [[""]]
        divider = Table(divider_data, colWidths=[18*cm])
        divider.setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, -1), 1, COLORS["primary"]),
        ]))
        elements.append(divider)
        elements.append(Spacer(1, 8))
        
        return elements
    
    def _create_patient_info(self, patient_name: Optional[str] = None, 
                             patient_age: Optional[str] = None,
                             patient_data: Optional[Dict[str, Any]] = None,
                             language: str = "ar") -> list:
        """Create patient information section with full details.
        
        Args:
            patient_name: Patient name
            patient_age: Patient age
            patient_data: Full patient data dict (conditions, medications, allergies, family_history)
            language: 'en' or 'ar'
        """
        elements = []
        is_english = language == "en"
        
        # Section title
        header_text = "Patient Information" if is_english else "بيانات المريض"
        header_style = self.styles['SectionHeaderEnglish'] if is_english else self.styles['SectionHeader']
        body_style = self.styles['BodyEnglish'] if is_english else self.styles['BodyArabic']
        
        # Create patient info card
        if patient_name or patient_age or patient_data:
            elements.append(Paragraph(header_text if is_english else reshape_arabic(header_text), header_style))
            
            # Basic info table
            info_data = []
            
            # Helper to create styled cell pairs
            def add_info_row(label_en, label_ar, value):
                label = label_en if is_english else label_ar
                
                if is_english:
                    clean_label = f"{label}:"
                    clean_value = value
                else:
                    # For Arabic, include the colon in the string BEFORE reshaping
                    # This ensures the Bidi algorithm places it correctly (on the left of the text)
                    clean_label = reshape_arabic(f"{label}:")
                    # Keep value as is for English, reshape for Arabic (except numbers like phone)
                    clean_value = reshape_arabic(str(value))
                    if label_en == 'Contact':
                        # Force LTR for phone numbers in Arabic
                        clean_value = str(value)
                
                info_data.append([
                    Paragraph(f"<b>{clean_label}</b>", body_style),
                    Paragraph(clean_value, body_style)
                ])

            if patient_name:
                add_info_row('Name', 'الاسم', patient_name)
            if patient_age:
                add_info_row('Age', 'العمر', patient_age)
            if patient_data:
                gender = patient_data.get('profile', {}).get('gender')
                if gender:
                    add_info_row('Gender', 'النوع', gender)
                
                # Add Contact Info
                phone = patient_data.get('profile', {}).get('phone') or patient_data.get('profile', {}).get('contact')
                if phone:
                    add_info_row('Contact', 'رقم الهاتف', phone)
            
            if info_data:
                # Create table for patient info
                # For English: [Label | Value]
                # For Arabic:  [Value | Label] (swapped columns for visual RTL)
                
                t_width = 17 * cm
                c0_width = 4 * cm # Label width
                c1_width = t_width - c0_width # Value width
                
                final_data = info_data
                final_widths = [c0_width, c1_width]
                
                if not is_english:
                    # Swap for Arabic: Value (Wide) | Label (Narrow)
                    # And ensure Label (Right col) is Right aligned, Value (Left col) is Right aligned (for reading flow)
                    final_data = [[row[1], row[0]] for row in info_data]
                    final_widths = [c1_width, c0_width]
                
                info_table = Table(final_data, colWidths=final_widths)
                info_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    # Alignments
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT' if is_english else 'RIGHT'),
                    # Remove borders for cleaner look
                    ('LINEBELOW', (0, 0), (-1, -1), 0.5, COLORS["border"]),
                ]))
                elements.append(info_table)
            
            elements.append(Spacer(1, 10))
            
            # Full patient data in colored boxes
            if patient_data:
                # Conditions
                conditions = patient_data.get('conditions', [])
                if conditions:
                    cond_title = "Medical Conditions" if is_english else "الأمراض المزمنة"
                    elements.append(Paragraph(cond_title if is_english else reshape_arabic(cond_title), header_style))
                    cond_text = ", ".join(conditions)
                    cond_table = Table([[self._clean_text(cond_text, is_english)]], colWidths=[17*cm])
                    cond_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, -1), COLORS["secondary_light"]),
                        ('TEXTCOLOR', (0, 0), (-1, -1), COLORS["dark"]),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT' if is_english else 'RIGHT'),
                        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica' if is_english else ('Arabic' if ARABIC_FONT_AVAILABLE else 'Helvetica')),
                        ('FONTSIZE', (0, 0), (-1, -1), 10),
                        ('PADDING', (0, 0), (-1, -1), 8),
                        ('BOX', (0, 0), (-1, -1), 1, COLORS["secondary"]),
                        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
                    ]))
                    elements.append(cond_table)
                    elements.append(Spacer(1, 8))
                
                # Medications
                medications = patient_data.get('medications', [])
                if medications:
                    med_title = "Current Medications" if is_english else "الأدوية الحالية"
                    elements.append(Paragraph(med_title if is_english else reshape_arabic(med_title), header_style))
                    med_list = [f"{m.get('name', m) if isinstance(m, dict) else m}" + 
                               (f" ({m.get('dosage', '')})" if isinstance(m, dict) and m.get('dosage') else "") 
                               for m in medications]
                    med_text = ", ".join(med_list)
                    med_table = Table([[self._clean_text(med_text, is_english)]], colWidths=[17*cm])
                    med_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, -1), COLORS["primary_light"]),
                        ('TEXTCOLOR', (0, 0), (-1, -1), COLORS["dark"]),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT' if is_english else 'RIGHT'),
                        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica' if is_english else ('Arabic' if ARABIC_FONT_AVAILABLE else 'Helvetica')),
                        ('FONTSIZE', (0, 0), (-1, -1), 10),
                        ('PADDING', (0, 0), (-1, -1), 8),
                        ('BOX', (0, 0), (-1, -1), 1, COLORS["primary"]),
                        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
                    ]))
                    elements.append(med_table)
                    elements.append(Spacer(1, 8))
                
                # Allergies
                allergies = patient_data.get('allergies', [])
                allergy_title = "Known Allergies" if is_english else "الحساسية المعروفة"
                elements.append(Paragraph(allergy_title if is_english else reshape_arabic(allergy_title), header_style))
                if allergies:
                    allergy_text = ", ".join(allergies)
                else:
                    allergy_text = "NKDA (No Known Drug Allergies)" if is_english else "لا توجد حساسية معروفة"
                allergy_table = Table([[self._clean_text(allergy_text, is_english)]], colWidths=[17*cm])
                allergy_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), COLORS["warning_light"] if allergies else COLORS["light"]),
                    ('TEXTCOLOR', (0, 0), (-1, -1), COLORS["dark"]),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT' if is_english else 'RIGHT'),
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica' if is_english else ('Arabic' if ARABIC_FONT_AVAILABLE else 'Helvetica')),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('PADDING', (0, 0), (-1, -1), 8),
                    ('BOX', (0, 0), (-1, -1), 1, COLORS["warning"] if allergies else COLORS["border"]),
                    ('ROUNDEDCORNERS', [8, 8, 8, 8]),
                ]))
                elements.append(allergy_table)
                elements.append(Spacer(1, 8))
                
                # Family History
                family_history = patient_data.get('family_history', [])
                if family_history:
                    fh_title = "Family History" if is_english else "التاريخ العائلي"
                    elements.append(Paragraph(fh_title if is_english else reshape_arabic(fh_title), header_style))
                    fh_list = [f"{fh.get('relation', 'Unknown')}: {fh.get('condition', 'Unknown')}" for fh in family_history]
                    fh_text = " | ".join(fh_list)
                    fh_table = Table([[self._clean_text(fh_text, is_english)]], colWidths=[17*cm])
                    fh_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, -1), COLORS["info_light"]),
                        ('TEXTCOLOR', (0, 0), (-1, -1), COLORS["dark"]),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT' if is_english else 'RIGHT'),
                        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica' if is_english else ('Arabic' if ARABIC_FONT_AVAILABLE else 'Helvetica')),
                        ('FONTSIZE', (0, 0), (-1, -1), 10),
                        ('PADDING', (0, 0), (-1, -1), 8),
                        ('BOX', (0, 0), (-1, -1), 1, COLORS["info"]),
                        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
                    ]))
                    elements.append(fh_table)
                    elements.append(Spacer(1, 8))
            
            elements.append(Spacer(1, 10))
        
        return elements
    
    def _clean_text(self, text: str, is_english: bool = True) -> str:
        """
        Clean text for ReportLab XML parser.
        - Fixes breaks (<br>, \n)
        - Escapes special chars
        - Converts markdown bold
        - Reshapes Arabic (and handles tags safely)
        """
        if not text:
            return ""
            
        import re
        
        # 1. Escape ampersands that aren't part of entities
        text = re.sub(r'&(?![a-zA-Z#]+;)', '&amp;', text)
        
        # 2. Fix break tags (convert to self-closing)
        text = text.replace('<br>', '<br/>').replace('\n', '<br/>')
        
        # 3. Convert markdown bold (**text** -> <b>text</b>)
        text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
        
        # 4. Remove square brackets and common hallucinated bullets/squares
        text = text.replace('[]', '').replace('[ ]', '').replace('■', '').replace('□', '').replace('▪', '').replace('▫', '')
        
        # 5. Fix Dashes and Hyphens (Convert ALL Unicode dashes to ASCII hyphen to prevent squares)
        # U+2010 Hyphen, U+2011 Non-breaking Hyphen, U+2012 Figure Dash, U+2013 En Dash, 
        # U+2014 Em Dash, U+2015 Horizontal Bar, U+2212 Minus Sign, U+2011 Non-breaking hyphen
        text = re.sub(r'[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\u2043\u2796]', '-', text)
        
        # Also replace Arabic-Indic digit range separator if any
        text = text.replace('\u066D', '-')
        
        # 6. Remove potential control characters
        text = re.sub(r'[\u200b\ufeff]', '', text)
        
        # 7. Remove emoji characters that render as squares
        # Common emojis used in headers: 🏥📋💊⚠️👨‍👩‍👧🩺💡🍽️🔬📊
        text = re.sub(r'[\U0001F300-\U0001F9FF]', '', text)  # Misc Symbols and Pictographs
        text = re.sub(r'[\u2600-\u26FF]', '', text)  # Misc Symbols
        text = re.sub(r'[\u2700-\u27BF]', '', text)  # Dingbats
        
        text = text.lstrip('#').strip()
        
        # 5. Handle Arabic text
        if not is_english:
            # For Arabic, simpler approach to avoid reshaping issues mixed with tags
            # Strip tags for now to ensure rendering stability
            clean_text = text.replace('<b>', '').replace('</b>', '').replace('<br/>', ' ')
            text = reshape_arabic(clean_text)
            
        return text

    def _create_analysis_section(self, analysis: str, language: str = "ar") -> list:
        """Create the main analysis section with proper formatting.
        
        Args:
            analysis: The analysis text
            language: 'en' for English (LTR) or 'ar' for Arabic (RTL)
        """
        elements = []
        is_english = language == "en"
        
        # Choose styles based on language
        body_style = self.styles['BodyEnglish'] if is_english else self.styles['BodyArabic']
        main_header_style = self.styles['MainHeaderEnglish'] if is_english else self.styles['MainHeaderArabic']
        sub_header_style = self.styles['SubHeaderEnglish'] if is_english else self.styles['SubHeaderArabic']
        section_header_style = self.styles['SectionHeaderEnglish'] if is_english else self.styles['SectionHeader']
    

        
        # Skip patterns for duplicate patient data (already shown in header)
        skip_patterns = [
            'تقرير طبي للمريض', 'بيانات المريض', 'الاسم:', 'العمر:', 'النوع:', 'رقم الهاتف:',
            'تاريخ التقرير:', '═══════', 'PATIENT DATA', 'Name:', 'Age:', 'Gender:', 'Contact:',
            '🏥 Chronic Conditions', '💊 Current Medications', '⚠️ Known Allergies', '👨‍👩‍👧 Family History',
            '🏥 الأمراض المزمنة', '💊 الأدوية الحالية', '⚠️ الحساسية', '👨‍👩‍👧 التاريخ العائلي',
            'التقرير الطبي للمريض', 'بيانات المريض الأساسية', 'التاريخ الطبي', 'الأدوية',
            'تقرير حالة', 'اسم المريض', 'Age:', 'Gender:', 'Phone:',
        ]
        
        # Table detection state
        in_table = False
        table_rows = []
        table_headers = []
        
        # Process analysis text - split by lines and create paragraphs
        lines = analysis.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                # End table if we were in one
                if in_table and table_rows:
                    elements.extend(self._render_table(table_headers, table_rows, is_english))
                    table_rows = []
                    table_headers = []
                    in_table = False
                elements.append(Spacer(1, 3))
                continue
            
            # Skip duplicate/header lines
            should_skip = False
            for pattern in skip_patterns:
                if pattern in line:
                    should_skip = True
                    break
            if should_skip:
                continue
            
            # Detect table lines (| ... | ... |)
            if '|' in line and line.count('|') >= 2:
                # Skip separator lines (|---|---|)
                if '---' in line or '====' in line:
                    continue
                
                # Parse table cells
                cells = [c.strip() for c in line.split('|') if c.strip()]
                if cells:
                    if not in_table:
                        # First row is headers
                        table_headers = cells
                        in_table = True
                    else:
                        table_rows.append(cells)
                continue
            
            # If we were in a table, render it before continuing
            if in_table and table_rows:
                elements.extend(self._render_table(table_headers, table_rows, is_english))
                table_rows = []
                table_headers = []
                in_table = False
            
            # Keep original line for header detection
            original_line = line
            
            # Use shared cleaning method
            display_line = self._clean_text(line, is_english)
            
            # Skip if line is too short / empty
            if len(display_line.strip()) < 2:
                continue

            try:
                # ## Main Headers (colored background)
                if original_line.startswith('## ') or original_line.startswith('##'):
                    elements.append(Paragraph(display_line, main_header_style))
                # Sub-headers with bold markers or emojis
                elif original_line.startswith('🚫') or original_line.startswith('✅') or \
                     (original_line.startswith('**') and original_line.endswith('**')):
                    elements.append(Paragraph(display_line, sub_header_style))
                # Section headers (emojis or numbered)
                elif any(original_line.startswith(c) for c in ['📋', '⚠️', '💊', '🏥', '📊', '📈', '🚫', '⚕️', '📝', '👨', '🔬', '✅', '🍽️', '🏃', '📅']) or \
                     (len(original_line) > 2 and original_line[0].isdigit() and original_line[1] == '.'):
                    elements.append(Paragraph(display_line, section_header_style))
                # Bullet points
                elif original_line.startswith('•') or original_line.startswith('-') or (original_line.startswith('*') and not original_line.startswith('**')):
                    elements.append(Paragraph(f"  {display_line}", body_style))
                # Regular text
                else:
                    elements.append(Paragraph(display_line, body_style))
            except Exception as e:
                logger.debug(f"Skipped line due to error: {e}")
                pass
        
        # Render any remaining table
        if in_table and table_rows:
            elements.extend(self._render_table(table_headers, table_rows, is_english))
        
        elements.append(Spacer(1, 8))
        return elements
    
    def _render_table(self, headers: list, rows: list, is_english: bool = True) -> list:
        """Render a formatted table from headers and rows with proper text wrapping.
        
        Args:
            headers: List of header strings
            rows: List of row lists
            is_english: True for LTR, False for RTL
        """
        elements = []
        
        if not headers or not rows:
            return elements
        
        try:
            num_cols = len(headers)
            
            # Smart column width calculation based on common table patterns
            total_width = 17 * cm
            
            # For Action Items table (Priority | Action | Timeframe)
            if num_cols == 3 and 'Priority' in headers[0]:
                col_widths = [2.5*cm, 11*cm, 3.5*cm]  # Priority small, Action large, Timeframe medium
            elif num_cols == 2:
                col_widths = [4*cm, 13*cm]  # First column small, second large
            else:
                # Default: distribute with first/last columns smaller
                col_widths = [total_width / num_cols] * num_cols
            
            # Create paragraph styles for table cells
            # Doctor (English) gets smaller fonts for denser clinical data
            # Patient (Arabic) keeps larger fonts for readability
            header_font_size = 10 if is_english else 13
            header_leading = 12 if is_english else 16
            cell_font_size = 9 if is_english else 11
            cell_leading = 11 if is_english else 14
            
            header_para_style = ParagraphStyle(
                'TableHeaderPara',
                fontSize=header_font_size,
                leading=header_leading,
                alignment=TA_CENTER,
                textColor=COLORS["white"],
                fontName='Helvetica-Bold' if is_english else ('Arabic' if ARABIC_FONT_AVAILABLE else 'Helvetica-Bold'),
            )
            
            cell_para_style = ParagraphStyle(
                'TableCellPara',
                fontSize=cell_font_size,
                leading=cell_leading,
                alignment=TA_LEFT if is_english else TA_RIGHT,
                textColor=COLORS["text"],
                fontName='Helvetica' if is_english else ('Arabic' if ARABIC_FONT_AVAILABLE else 'Helvetica'),
                wordWrap='CJK',  # Enable word wrapping
            )
            
            # Convert text to Paragraph objects for proper wrapping
            table_data = []
            
            # Header row with Paragraphs (Cleaned & Reshaped)
            header_row = []
            for h in headers:
                h_text = self._clean_text(str(h).strip(), is_english)
                header_row.append(Paragraph(h_text, header_para_style))
            table_data.append(header_row)
            
            # Data rows with Paragraphs
            for row in rows:
                para_row = []
                for i, cell in enumerate(row):
                    if i >= num_cols:
                        break
                    
                    cell_str = str(cell).strip() if cell else ""
                    
                    # Handle text
                    if is_english:
                        cell_text = self._clean_text(cell_str, True)
                    else:
                        # Arabic: Manual wrapping with Structure Preservation
                        # 1. Standardize breaks
                        clean_cell = cell_str.replace('<br>', '\n').replace('<br/>', '\n').replace('<b>', '').replace('</b>', '')
                        clean_cell = re.sub(r'\*\*(.+?)\*\*', r'\1', clean_cell) # Remove markdown bold
                        
                        # 2. Split into logical paragraphs (preserve numbered lists)
                        paragraphs = clean_cell.split('\n')
                        
                        # 3. Estimate chars per line
                        # ~6.0 chars per cm is a good estimate for Arial 9
                        # (4cm column = ~24 chars)
                        width_cm = col_widths[i] / cm
                        char_limit = int(width_cm * 6.0)
                        
                        final_lines = []
                        for para in paragraphs:
                            para = para.strip()
                            if not para:
                                continue
                            # Wrap this paragraph
                            wrapped = textwrap.wrap(para, width=char_limit)
                            # Reshape individually
                            reshaped = [reshape_arabic(line) for line in wrapped]
                            final_lines.extend(reshaped)
                            
                        # Join with breaks
                        cell_text = "<br/>".join(final_lines) if final_lines else ""

                    para_row.append(Paragraph(cell_text, cell_para_style))
                
                # Pad with empty cells if needed
                while len(para_row) < num_cols:
                    para_row.append(Paragraph("", cell_para_style))
                
                table_data.append(para_row)
            
            # Create table
            table = Table(table_data, colWidths=col_widths)
            
            # Style the table
            style = TableStyle([
                # Header row
                ('BACKGROUND', (0, 0), (-1, 0), COLORS["primary"]),
                ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('TOPPADDING', (0, 0), (-1, 0), 10),
                
                # Data rows
                ('VALIGN', (0, 1), (-1, -1), 'TOP'),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ('TOPPADDING', (0, 1), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                
                # Grid - Softer styling
                ('GRID', (0, 0), (-1, -1), 0.5, COLORS["border"]),
                ('BOX', (0, 0), (-1, -1), 1, COLORS["primary"]),
                ('LINEBEFORE', (0, 0), (0, -1), 1, COLORS["primary"]),
                ('LINEAFTER', (-1, 0), (-1, -1), 1, COLORS["primary"]),
                
                # Alternating row colors for readability
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [COLORS["white"], COLORS["primary_light"]]),
            ])
            
            table.setStyle(style)
            elements.append(table)
            elements.append(Spacer(1, 12))
            
        except Exception as e:
            logger.warning(f"Table rendering error: {e}")
            # Fallback: render as text
            for row in rows:
                elements.append(Paragraph(f"• {' | '.join(row)}", self.styles['BodyEnglish']))
        
        return elements
    
    def _create_footer(self, language: str = "ar") -> list:
        """Create report footer with disclaimer.
        
        Args:
            language: 'en' for English, 'ar' for Arabic
        """
        elements = []
        is_english = language == "en"
        
        # Divider
        divider_data = [[""]]
        divider = Table(divider_data, colWidths=[18*cm])
        divider.setStyle(TableStyle([
            ('LINEABOVE', (0, 0), (-1, -1), 1, COLORS["muted"]),
        ]))
        elements.append(divider)
        elements.append(Spacer(1, 10))
        
        # Disclaimer - language-specific
        if is_english:
            disclaimer = "⚠️ DISCLAIMER: This report was generated by AI and is for reference only. Please consult a qualified physician for diagnosis and treatment."
            elements.append(Paragraph(disclaimer, self.styles['Footer']))
        else:
            disclaimer = "⚠️ تنبيه هام: هذا التقرير تم إنشاؤه بواسطة الذكاء الاصطناعي وهو للاستئناس فقط. يرجى مراجعة طبيب متخصص للتشخيص والعلاج النهائي."
            elements.append(Paragraph(reshape_arabic(disclaimer), self.styles['Footer']))
        
        elements.append(Spacer(1, 10))
        
        # Contact info
        contact = "🏥 MediScan Medical Center | 📞 16888 | 🌐 www.mediscan-eg.com"
        elements.append(Paragraph(contact, self.styles['Footer']))
        
        return elements
    
    def generate_report(
        self,
        analysis: str,
        patient_name: Optional[str] = None,
        patient_age: Optional[str] = None,
        image_path: Optional[str] = None,
        report_id: Optional[str] = None,
        language: str = "ar",
        patient_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate a PDF report from analysis results.
        
        Args:
            analysis: The medical analysis text
            patient_name: Optional patient name
            patient_age: Optional patient age
            image_path: Optional path to analyzed image
            report_id: Optional custom report ID
            language: 'en' for English (LTR), 'ar' for Arabic (RTL)
            patient_data: Full patient data dict (conditions, medications, allergies, family_history)
        
        Returns:
            Path to the generated PDF file
        """
        try:
            # Generate report filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            lang_suffix = "en" if language == "en" else "ar"
            report_id = report_id or f"RPT_{timestamp}_{lang_suffix}"
            pdf_filename = f"mediscan_report_{report_id}.pdf"
            pdf_path = REPORTS_DIR / pdf_filename
            
            # Create PDF document
            doc = SimpleDocTemplate(
                str(pdf_path),
                pagesize=A4,
                rightMargin=1.5*cm,
                leftMargin=1.5*cm,
                topMargin=1.5*cm,
                bottomMargin=1.5*cm
            )
            
            # Build document elements
            elements = []
            
            # Header
            elements.extend(self._create_header())
            
            # Patient info with full data
            elements.extend(self._create_patient_info(
                patient_name=patient_name, 
                patient_age=patient_age,
                patient_data=patient_data,
                language=language
            ))
            
            # Analysis with correct text direction
            elements.extend(self._create_analysis_section(analysis, language))
            
            # Footer with correct language
            elements.extend(self._create_footer(language))
            
            # Build PDF
            doc.build(elements)
            
            logger.info(f"✅ PDF Report generated ({lang_suffix}): {pdf_path}")
            return str(pdf_path)
            
        except Exception as e:
            logger.error(f"❌ PDF generation error: {e}")
            raise

    def generate_report_bytes(
        self,
        analysis: str,
        patient_name: Optional[str] = None,
        patient_age: Optional[str] = None,
    ) -> bytes:
        """
        Generate PDF report and return as bytes (for API streaming).
        """
        try:
            buffer = io.BytesIO()
            
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=1.5*cm,
                leftMargin=1.5*cm,
                topMargin=1.5*cm,
                bottomMargin=1.5*cm
            )
            
            elements = []
            elements.extend(self._create_header())
            elements.extend(self._create_patient_info(patient_name, patient_age))
            elements.extend(self._create_analysis_section(analysis))
            elements.extend(self._create_footer())
            
            doc.build(elements)
            
            buffer.seek(0)
            return buffer.getvalue()
            
        except Exception as e:
            logger.error(f"❌ PDF bytes generation error: {e}")
            raise


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_report_generator = None

def get_report_generator() -> MedicalReportGenerator:
    """Get or create the report generator instance."""
    global _report_generator
    if _report_generator is None:
        _report_generator = MedicalReportGenerator()
    return _report_generator

# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def generate_pdf_report(
    analysis: str,
    patient_name: Optional[str] = None,
    patient_age: Optional[str] = None,
    image_path: Optional[str] = None,
    report_id: Optional[str] = None,
    language: str = "ar",
    patient_data: Optional[Dict[str, Any]] = None
) -> str:
    """
    Generate a PDF report from analysis results.
    
    Args:
        language: 'en' for English (LTR), 'ar' for Arabic (RTL)
        patient_data: Full patient data dict for displaying conditions, medications, etc.
    
    Returns the path to the generated PDF file.
    """
    generator = get_report_generator()
    return generator.generate_report(
        analysis=analysis,
        patient_name=patient_name,
        patient_age=patient_age,
        image_path=image_path,
        report_id=report_id,
        language=language,
        patient_data=patient_data
    )

def generate_pdf_bytes(
    analysis: str,
    patient_name: Optional[str] = None,
    patient_age: Optional[str] = None,
) -> bytes:
    """
    Generate PDF report and return as bytes for streaming.
    """
    generator = get_report_generator()
    return generator.generate_report_bytes(
        analysis=analysis,
        patient_name=patient_name,
        patient_age=patient_age
    )

def generate_patient_history_pdf(patient_history: Dict[str, Any]) -> str:
    """
    Generate a comprehensive PDF of patient's medical history.
    
    Args:
        patient_history: Patient history dictionary from medical_history module
    
    Returns:
        Path to the generated PDF file
    """
    try:
        generator = get_report_generator()
        
        # Extract patient info
        patient_id = patient_history.get("patient_id", "unknown")
        profile = patient_history.get("profile", {})
        patient_name = profile.get("name", "غير محدد")
        patient_age = profile.get("age", "")
        
        # Build comprehensive report content
        content_sections = []
        
        # 1. Patient Profile
        content_sections.append("📋 **بيانات المريض**")
        content_sections.append(f"معرف المريض: {patient_id}")
        if profile.get("name"):
            content_sections.append(f"الاسم: {profile['name']}")
        if profile.get("age"):
            content_sections.append(f"العمر: {profile['age']}")
        if profile.get("gender"):
            content_sections.append(f"النوع: {profile['gender']}")
        if profile.get("phone"):
            content_sections.append(f"الهاتف: {profile['phone']}")
        content_sections.append("")
        
        # 2. Active Warnings
        warnings = patient_history.get("warnings", [])
        active_warnings = [w for w in warnings if w.get("active", True)]
        if active_warnings:
            content_sections.append("⚠️ **التحذيرات النشطة**")
            for w in active_warnings:
                severity_icon = "🔴" if w.get("severity") == "critical" else "🟡"
                content_sections.append(f"{severity_icon} {w.get('content', '')}")
            content_sections.append("")
        
        # 3. Current Medications
        medications = patient_history.get("medications", [])
        active_meds = [m for m in medications if m.get("active", True)]
        if active_meds:
            content_sections.append("💊 **الأدوية الحالية**")
            for m in active_meds:
                med_text = f"• {m.get('name', '')}"
                if m.get("dosage"):
                    med_text += f" - {m['dosage']}"
                if m.get("frequency"):
                    med_text += f" ({m['frequency']})"
                content_sections.append(med_text)
            content_sections.append("")
        
        # 4. Known Conditions
        conditions = patient_history.get("conditions", [])
        if conditions:
            content_sections.append("🏥 **الحالات المرضية المسجلة**")
            for c in conditions:
                content_sections.append(f"• {c}")
            content_sections.append("")
        
        # 5. Allergies
        allergies = patient_history.get("allergies", [])
        if allergies:
            content_sections.append("🚫 **الحساسية**")
            for a in allergies:
                content_sections.append(f"• {a}")
            content_sections.append("")
        
        # 6. Recent Records (last 5)
        records = patient_history.get("records", [])
        if records:
            content_sections.append("📊 **آخر السجلات الطبية**")
            recent_records = sorted(records, key=lambda x: x.get("timestamp", ""), reverse=True)[:5]
            for r in recent_records:
                record_type = r.get("type", "unknown")
                timestamp = r.get("timestamp", "")[:10]
                content = r.get("content", "")[:100]
                type_icons = {
                    "analysis": "🔬",
                    "warning": "⚠️",
                    "medication": "💊",
                    "diagnosis": "🩺",
                    "comparison": "📊"
                }
                icon = type_icons.get(record_type, "📝")
                content_sections.append(f"{icon} [{timestamp}] {content}...")
            content_sections.append("")
        
        # 7. Summary Stats
        content_sections.append("📈 **إحصائيات**")
        content_sections.append(f"إجمالي السجلات: {len(records)}")
        content_sections.append(f"التحذيرات النشطة: {len(active_warnings)}")
        content_sections.append(f"الأدوية الحالية: {len(active_meds)}")
        content_sections.append(f"الحالات المسجلة: {len(conditions)}")
        content_sections.append(f"آخر تحديث: {patient_history.get('updated_at', '')[:10]}")
        
        # Combine all content
        full_content = "\n".join(content_sections)
        
        # Generate PDF
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_id = f"HISTORY_{patient_id}_{timestamp}"
        
        return generator.generate_report(
            analysis=full_content,
            patient_name=patient_name,
            patient_age=patient_age,
            report_id=report_id
        )
        
    except Exception as e:
        logger.error(f"❌ Patient history PDF error: {e}")
        raise

logger.info("✅ PDF Report Generator loaded")
