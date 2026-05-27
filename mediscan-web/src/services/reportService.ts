/* eslint-disable */
/**
 * reportService.ts
 *
 * Handles the two-step AI Medical Report flow:
 *   Step 1 → POST /api/ai/GenerateMedicalReport  (.NET 7196)  — triggers data sync to RAG
 *   Step 2 → GET http://localhost:8000/report/{id}/doctor-report  (Python RAG 8000) — fetches text
 *
 * PDF download also calls the Python RAG service directly.
 * Warnings (NAM / Forbidden Medicines) come from Python RAG GET /patient/{id}/warnings.
 */

import apiClient from '@/lib/axios';
import axios from 'axios';
import type { ReturnBase, MedicalReportResponse, PatientWarningsResponse } from '@/types/api';
import { streamAiEndpoint, type AiStreamChunk } from '@/services/aiService';

// ─── Python RAG Axios instance (no auth token, port 8000) ─────────────────────
const RAG_BASE = process.env.NEXT_PUBLIC_RAG_URL ?? 'http://localhost:8005';

const ragClient = axios.create({
  baseURL: RAG_BASE,
  timeout: 60_000, // RAG can be slow — 60 s
  headers: { 'Content-Type': 'application/json' },
});

// ─── Service ───────────────────────────────────────────────────────────────────
export const reportService = {
  /**
   * Step 1: Trigger .NET to sync patient data to the RAG service.
   * POST /api/ai/GenerateMedicalReport
   * [FromBody] AddMedicalReportCommand { patientId }
   *
   * Returns ReturnBase<bool>. If succeeded === false, the caller must NOT proceed to step 2.
   */
  triggerReportGeneration: async (patientId: string): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.post<ReturnBase<boolean>>(
      '/ai/GenerateMedicalReport',
      { patientId }
    );
    return data;
  },

  /**
   * Step 2: Fetch the AI-generated report text from the Python RAG service.
   * GET /report/{patientId}/doctor-report?user_role=patient|doctor&force_refresh=true|false
   *
   * Call ONLY after triggerReportGeneration() succeeds.
   */
  fetchReportText: async (patientId: string, userRole: 'patient' | 'doctor' = 'patient', forceRefresh: boolean = false): Promise<MedicalReportResponse> => {
    const { data } = await ragClient.get<MedicalReportResponse>(
      `/report/${patientId}/doctor-report`,
      { params: { user_role: userRole, force_refresh: forceRefresh } }
    );
    return data;
  },

  /**
   * Combined helper: runs step 1 then step 2.
   * Throws if either step fails — caller should catch and show error state.
   */
  generateAndFetch: async (patientId: string, userRole: 'patient' | 'doctor' = 'patient'): Promise<MedicalReportResponse> => {
    // Step 1 — .NET backend sync
    const trigger = await reportService.triggerReportGeneration(patientId);
    if (!trigger.succeeded) {
      throw new Error(trigger.message || 'Failed to generate report');
    }
    // Step 2 — Python RAG text (Force generation)
    const report = await reportService.fetchReportText(patientId, userRole, true);
    if (report.status !== 'success') {
      throw new Error('RAG service returned an error');
    }
    return report;
  },

  /**
   * Download the PDF report from Python RAG.
   * GET /report/{patientId}/doctor-report/pdf?user_role=...
   * Triggers a browser blob download — does NOT open in a new tab.
   */
  downloadReportPdf: async (patientId: string, userRole: 'patient' | 'doctor' = 'patient'): Promise<void> => {
    const response = await ragClient.get(
      `/report/${patientId}/doctor-report/pdf`,
      {
        params: { user_role: userRole },
        responseType: 'blob',
      }
    );
    const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediscan_report_${patientId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Fetch patient drug interaction / allergy warnings from Python RAG.
   * GET /patient/{patientId}/warnings
   * Used by the Forbidden Medicines page. Gracefully falls back to local data on failure.
   */
  fetchWarnings: async (patientId: string): Promise<PatientWarningsResponse> => {
    const { data } = await ragClient.get<PatientWarningsResponse>(
      `/patient/${patientId}/warnings`
    );
    return data;
  },
};

export async function* streamMedicalReport(
  patientId: string,
  userRole: 'patient' | 'doctor' = 'patient',
  forceRefresh: boolean = true,
  signal?: AbortSignal
): AsyncGenerator<AiStreamChunk> {
  const url = `${RAG_BASE}/report/${patientId}/doctor-report/stream?user_role=${userRole}&force_refresh=${forceRefresh}`;

  const res = await fetch(url, { method: 'GET', signal });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        yield JSON.parse(line.slice(6)) as AiStreamChunk;
      } catch { /* skip */ }
    }
  }
}
