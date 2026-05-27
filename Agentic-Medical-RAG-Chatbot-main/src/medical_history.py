"""
MediScan - Medical History Module
=================================
Patient medical history management with JSON storage.

Features:
- Store patient records in JSON files
- Auto-extract warnings from AI responses
- Track medications, diseases, and recommendations
- Link analysis results to patient history
"""

import os
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

# Medical history storage directory
HISTORY_DIR = Path(__file__).parent.parent / "data" / "patient_history"
HISTORY_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================================
# DATA MODELS
# ============================================================================

class MedicalRecord:
    """A single medical record/event."""
    
    def __init__(
        self,
        record_type: str,  # "analysis", "chat", "warning", "medication", "diagnosis"
        content: str,
        source: str = "ai",  # "ai", "manual", "lab"
        severity: str = "info",  # "info", "warning", "critical"
        metadata: Optional[Dict] = None
    ):
        self.id = datetime.now().strftime("%Y%m%d%H%M%S%f")
        self.timestamp = datetime.now().isoformat()
        self.record_type = record_type
        self.content = content
        self.source = source
        self.severity = severity
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "type": self.record_type,
            "content": self.content,
            "source": self.source,
            "severity": self.severity,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "MedicalRecord":
        record = cls(
            record_type=data.get("type", "unknown"),
            content=data.get("content", ""),
            source=data.get("source", "unknown"),
            severity=data.get("severity", "info"),
            metadata=data.get("metadata", {})
        )
        record.id = data.get("id", record.id)
        record.timestamp = data.get("timestamp", record.timestamp)
        return record


class PatientHistory:
    """Complete patient medical history."""
    
    def __init__(self, patient_id: str):
        self.patient_id = patient_id
        self.created_at = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()
        self.profile: Dict[str, Any] = {}  # name, age, gender, etc.
        self.records: List[Dict] = []
        self.warnings: List[Dict] = []  # Active warnings
        self.medications: List[Dict] = []  # Current medications
        self.conditions: List[str] = []  # Known conditions/diseases
        self.allergies: List[str] = []
        self.family_history: List[Dict] = []  # Family medical history
        self.latest_report_ar: Optional[str] = None
        self.latest_report_en: Optional[str] = None
        self.blood_type: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "patient_id": self.patient_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "profile": self.profile,
            "records": self.records,
            "warnings": self.warnings,
            "medications": self.medications,
            "conditions": self.conditions,
            "allergies": self.allergies,
            "family_history": self.family_history,
            "latest_report_ar": self.latest_report_ar,
            "latest_report_en": self.latest_report_en,
            "blood_type": self.blood_type
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "PatientHistory":
        history = cls(data.get("patient_id", "unknown"))
        history.created_at = data.get("created_at", history.created_at)
        history.updated_at = data.get("updated_at", history.updated_at)
        history.profile = data.get("profile", {})
        history.records = data.get("records", [])
        history.warnings = data.get("warnings", [])
        history.medications = data.get("medications", [])
        history.conditions = data.get("conditions", [])
        history.allergies = data.get("allergies", [])
        history.family_history = data.get("family_history", [])
        history.latest_report_ar = data.get("latest_report_ar")
        history.latest_report_en = data.get("latest_report_en")
        history.blood_type = data.get("blood_type")
        return history

# ============================================================================
# MEDICAL HISTORY MANAGER
# ============================================================================

class MedicalHistoryManager:
    """Manage patient medical histories with JSON storage."""
    
    def __init__(self):
        self.storage_dir = HISTORY_DIR
        logger.info(f"📁 Medical history storage: {self.storage_dir}")
    
    def _get_patient_file(self, patient_id: str) -> Path:
        """Get path to patient's JSON file."""
        # Sanitize patient_id for filename
        safe_id = re.sub(r'[^\w\-]', '_', patient_id)
        return self.storage_dir / f"patient_{safe_id}.json"
    
    def get_patient_history(self, patient_id: str) -> PatientHistory:
        """Get or create patient history."""
        file_path = self._get_patient_file(patient_id)
        
        if file_path.exists():
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                return PatientHistory.from_dict(data)
            except Exception as e:
                logger.error(f"Error loading patient history: {e}")
        
        # Create new history
        return PatientHistory(patient_id)
    
    def save_patient_history(self, history: PatientHistory) -> bool:
        """Save patient history to JSON file."""
        try:
            file_path = self._get_patient_file(history.patient_id)
            history.updated_at = datetime.now().isoformat()
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(history.to_dict(), f, ensure_ascii=False, indent=2)
            
            logger.info(f"✅ Saved history for patient: {history.patient_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving patient history: {e}")
            return False
    
    def add_record(
        self,
        patient_id: str,
        record_type: str,
        content: str,
        source: str = "ai",
        severity: str = "info",
        metadata: Optional[Dict] = None
    ) -> bool:
        """Add a new record to patient history."""
        history = self.get_patient_history(patient_id)
        
        record = MedicalRecord(
            record_type=record_type,
            content=content,
            source=source,
            severity=severity,
            metadata=metadata
        )
        
        history.records.append(record.to_dict())
        
        # Auto-add warnings if critical
        if severity in ["warning", "critical"]:
            history.warnings.append({
                "id": record.id,
                "timestamp": record.timestamp,
                "content": content,
                "severity": severity,
                "active": True
            })
        
        return self.save_patient_history(history)
    
    def add_analysis_result(
        self,
        patient_id: str,
        analysis: str,
        image_path: Optional[str] = None
    ) -> bool:
        """Add an analysis result and extract warnings."""
        # Extract warnings from analysis
        warnings = self.extract_warnings_from_text(analysis)
        
        # Add main analysis record
        self.add_record(
            patient_id=patient_id,
            record_type="analysis",
            content=analysis,
            source="ai",
            severity="warning" if warnings else "info",
            metadata={"image_path": image_path} if image_path else {}
        )
        
        # Add individual warnings
        for warning in warnings:
            self.add_record(
                patient_id=patient_id,
                record_type="warning",
                content=warning["content"],
                source="ai",
                severity=warning["severity"],
                metadata={"extracted_from": "analysis"}
            )
        
        return True
    
    def extract_warnings_from_text(self, text: str) -> List[Dict]:
        """
        Extract medical warnings from AI response text.
        Looks for specific patterns indicating warnings.
        """
        warnings = []
        
        # Patterns for warnings (Arabic + English)
        warning_patterns = [
            # Arabic patterns
            (r'⚠️[^✅❌\n]+', 'warning'),
            (r'تحذير[:\s]+([^\n]+)', 'warning'),
            (r'خطر[:\s]+([^\n]+)', 'critical'),
            (r'لازم تروح للدكتور[^\.]+', 'critical'),
            (r'استشير طبيب[^\.]+', 'warning'),
            (r'توقف عن[^\.]+', 'critical'),
            (r'تجنب[^\.]+', 'warning'),
            (r'ممنوع[^\.]+', 'critical'),
            # Abnormal values
            (r'غير طبيعي[^\.]+', 'warning'),
            (r'مرتفع جداً[^\.]+', 'warning'),
            (r'منخفض جداً[^\.]+', 'warning'),
            # English patterns
            (r'Warning[:\s]+([^\n]+)', 'warning'),
            (r'Critical[:\s]+([^\n]+)', 'critical'),
            (r'Abnormal[:\s]+([^\n]+)', 'warning'),
        ]
        
        for pattern, severity in warning_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                content = match if isinstance(match, str) else match[0] if match else ""
                if content and len(content) > 5:
                    warnings.append({
                        "content": content.strip(),
                        "severity": severity
                    })
        
        # Remove duplicates
        seen = set()
        unique_warnings = []
        for w in warnings:
            if w["content"] not in seen:
                seen.add(w["content"])
                unique_warnings.append(w)
        
        return unique_warnings
    
    def add_medication(
        self,
        patient_id: str,
        medication_name: str,
        dosage: Optional[str] = None,
        frequency: Optional[str] = None,
        notes: Optional[str] = None
    ) -> bool:
        """Add a medication to patient's list."""
        history = self.get_patient_history(patient_id)
        
        medication = {
            "id": datetime.now().strftime("%Y%m%d%H%M%S%f"),
            "name": medication_name,
            "dosage": dosage,
            "frequency": frequency,
            "notes": notes,
            "added_at": datetime.now().isoformat(),
            "active": True
        }
        
        history.medications.append(medication)
        return self.save_patient_history(history)
    
    def add_condition(self, patient_id: str, condition: str) -> bool:
        """Add a medical condition to patient's history."""
        history = self.get_patient_history(patient_id)
        
        if condition not in history.conditions:
            history.conditions.append(condition)
            
            # Also add as a record
            self.add_record(
                patient_id=patient_id,
                record_type="diagnosis",
                content=f"تم تسجيل حالة: {condition}",
                source="manual",
                severity="info"
            )
        
        return self.save_patient_history(history)
    
    def add_allergy(self, patient_id: str, allergy: str) -> bool:
        """Add an allergy to patient's history."""
        history = self.get_patient_history(patient_id)
        
        if allergy not in history.allergies:
            history.allergies.append(allergy)
            
            # Also add as a record
            self.add_record(
                patient_id=patient_id,
                record_type="diagnosis",
                content=f"تم تسجيل حساسية: {allergy}",
                source="manual",
                severity="warning"
            )
        
        return self.save_patient_history(history)
    
    def add_family_history(
        self,
        patient_id: str,
        relation: str,  # "father", "mother", "sibling", "grandparent"
        condition: str,
        notes: Optional[str] = None
    ) -> bool:
        """Add a family medical history entry.
        
        Args:
            patient_id: Patient identifier
            relation: Family member relationship (father, mother, sibling, etc.)
            condition: Medical condition the family member has/had
            notes: Optional additional notes
        """
        history = self.get_patient_history(patient_id)
        
        family_entry = {
            "id": datetime.now().strftime("%Y%m%d%H%M%S%f"),
            "relation": relation,
            "condition": condition,
            "notes": notes,
            "added_at": datetime.now().isoformat()
        }
        
        # Check if similar entry exists
        for entry in history.family_history:
            if entry.get("relation") == relation and entry.get("condition") == condition:
                logger.info(f"Family history entry already exists for: {relation} - {condition}")
                return True
        
        history.family_history.append(family_entry)
        history.updated_at = datetime.now().isoformat()
        
        logger.info(f"➕ Family history added for {patient_id}: {relation} - {condition}")
        
        # Record it
        self.add_record(
            patient_id=patient_id,
            record_type="family_history",
            content=f"تم تسجيل تاريخ عائلي: {relation} - {condition}",
            source="manual",
            severity="info"
        )
        
        return self.save_patient_history(history)
    
    def update_profile(
        self,
        patient_id: str,
        name: Optional[str] = None,
        age: Optional[str] = None,
        gender: Optional[str] = None,
        phone: Optional[str] = None,
        **kwargs
    ) -> bool:
        """Update patient profile information."""
        history = self.get_patient_history(patient_id)
        
        if name:
            history.profile["name"] = name
        if age:
            history.profile["age"] = age
        if gender:
            history.profile["gender"] = gender
        if phone:
            history.profile["phone"] = phone
        if kwargs.get('blood_type'):
            history.blood_type = kwargs.get('blood_type')
        
        # Add any extra fields
        history.profile.update(kwargs)
        
        return self.save_patient_history(history)
    
    def get_active_warnings(self, patient_id: str) -> List[Dict]:
        """Get all active warnings for a patient."""
        history = self.get_patient_history(patient_id)
        return [w for w in history.warnings if w.get("active", True)]
    
    def get_patient_summary(self, patient_id: str) -> Dict:
        """Get a summary of patient's medical history."""
        history = self.get_patient_history(patient_id)
        
        return {
            "patient_id": patient_id,
            "profile": history.profile,
            "conditions_count": len(history.conditions),
            "conditions": history.conditions,
            "medications_count": len([m for m in history.medications if m.get("active")]),
            "active_medications": [m["name"] for m in history.medications if m.get("active")],
            "active_warnings_count": len(self.get_active_warnings(patient_id)),
            "total_records": len(history.records),
            "last_updated": history.updated_at
        }
    
    def delete_patient_history(self, patient_id: str) -> bool:
        """Delete a patient's history file."""
        try:
            file_path = self._get_patient_file(patient_id)
            if file_path.exists():
                file_path.unlink()
                logger.info(f"🗑️ Deleted history for patient: {patient_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting patient history: {e}")
            return False


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_history_manager = None

def get_history_manager() -> MedicalHistoryManager:
    """Get or create the history manager instance."""
    global _history_manager
    if _history_manager is None:
        _history_manager = MedicalHistoryManager()
    return _history_manager

# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def get_patient_history(patient_id: str) -> Dict:
    """Get patient history as dictionary."""
    manager = get_history_manager()
    return manager.get_patient_history(patient_id).to_dict()

def add_medical_record(
    patient_id: str,
    record_type: str,
    content: str,
    **kwargs
) -> bool:
    """Add a medical record."""
    manager = get_history_manager()
    return manager.add_record(patient_id, record_type, content, **kwargs)

def process_analysis_for_patient(
    patient_id: str,
    analysis: str,
    image_path: Optional[str] = None
) -> Dict:
    """Process analysis result and add to patient history."""
    manager = get_history_manager()
    manager.add_analysis_result(patient_id, analysis, image_path)
    
    # Return extracted warnings
    warnings = manager.extract_warnings_from_text(analysis)
    return {
        "warnings_found": len(warnings),
        "warnings": warnings,
        "patient_id": patient_id
    }

logger.info("✅ Medical History module loaded")
