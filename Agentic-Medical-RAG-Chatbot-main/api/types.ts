/**
 * MediScan API TypeScript Types
 * ==============================
 * Use these types for Frontend integration
 */

// ============================================================================
// USER ROLE
// ============================================================================

export type UserRole = 'patient' | 'doctor';
// patient = Arabic responses (Egyptian dialect)
// doctor = English responses (Clinical terminology)


// ============================================================================
// CHAT
// ============================================================================

export interface ChatRequest {
    message: string;
    patient_id?: string;
    session_id?: string;
    user_role: UserRole;
}

export interface ChatResponse {
    status: 'success' | 'error';
    session_id: string;
    response: string;
    timestamp: string;
    cached: boolean;
}


// ============================================================================
// IMAGE ANALYSIS
// ============================================================================

export type ImageType = 'blood_test' | 'xray' | 'skin' | 'auto';

export interface ImageAnalysisResponse {
    status: 'success' | 'error';
    analysis: string;
    image_path?: string;
    timestamp: string;
    cached: boolean;
}


// ============================================================================
// PATIENT
// ============================================================================

export interface PatientProfile {
    name?: string;
    age?: string;
    gender?: 'male' | 'female';
    phone?: string;
}

export interface Medication {
    name: string;
    dosage?: string;
    frequency?: string;
    notes?: string;
}

export interface FamilyHistory {
    relation: 'father' | 'mother' | 'sibling' | 'grandparent' | string;
    condition: string;
    notes?: string;
}

export interface MedicalRecord {
    record_type: 'analysis' | 'warning' | 'medication' | 'diagnosis';
    content: string;
    severity?: 'info' | 'warning' | 'critical';
    timestamp?: string;
}

export interface Patient {
    patient_id: string;
    profile: PatientProfile;
    conditions: string[];
    medications: Medication[];
    allergies: string[];
    family_history: FamilyHistory[];
    medical_records: MedicalRecord[];
    created_at: string;
    updated_at: string;
}


// ============================================================================
// REPORTS
// ============================================================================

export interface DoctorReport {
    status: 'success' | 'error';
    patient_id: string;
    report: string;
    generated_at: string;
}

export interface QuickSummary {
    status: 'success' | 'error';
    patient_id: string;
    summary: {
        conditions_count: number;
        medications_count: number;
        allergies_count: number;
        has_family_history: boolean;
    };
}


// ============================================================================
// GENERAL
// ============================================================================

export interface HealthResponse {
    status: 'ok' | 'error';
    message: string;
    timestamp: string;
}

export interface ErrorResponse {
    status: 'error';
    detail: string;
    timestamp: string;
}


// ============================================================================
// API HELPER
// ============================================================================

const BASE_URL = 'http://localhost:8000';

export const MediScanAPI = {
    // Health Check
    health: async (): Promise<HealthResponse> => {
        const res = await fetch(`${BASE_URL}/health`);
        return res.json();
    },

    // Chat
    chat: async (request: ChatRequest): Promise<ChatResponse> => {
        const res = await fetch(`${BASE_URL}/chat/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });
        return res.json();
    },

    // Image Analysis
    analyzeImage: async (file: File, userRole: UserRole, imageType?: ImageType): Promise<ImageAnalysisResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_role', userRole);
        if (imageType) formData.append('image_type', imageType);

        const res = await fetch(`${BASE_URL}/images/analyze`, {
            method: 'POST',
            body: formData
        });
        return res.json();
    },

    // Patient
    getPatient: async (patientId: string): Promise<Patient> => {
        const res = await fetch(`${BASE_URL}/patient/${patientId}`);
        return res.json();
    },

    updateProfile: async (patientId: string, profile: PatientProfile): Promise<any> => {
        const res = await fetch(`${BASE_URL}/patient/${patientId}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });
        return res.json();
    },

    addConditions: async (patientId: string, conditions: string[]): Promise<any> => {
        const res = await fetch(`${BASE_URL}/patient/${patientId}/conditions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conditions })
        });
        return res.json();
    },

    addMedications: async (patientId: string, medications: Medication[]): Promise<any> => {
        const res = await fetch(`${BASE_URL}/patient/${patientId}/medications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ medications })
        });
        return res.json();
    },

    // Reports
    getDoctorReport: async (patientId: string, userRole: UserRole): Promise<DoctorReport> => {
        const res = await fetch(`${BASE_URL}/report/${patientId}/doctor-report?user_role=${userRole}`);
        return res.json();
    },

    downloadReportPDF: async (patientId: string, userRole: UserRole): Promise<Blob> => {
        const res = await fetch(`${BASE_URL}/report/${patientId}/doctor-report/pdf?user_role=${userRole}`);
        return res.blob();
    }
};
