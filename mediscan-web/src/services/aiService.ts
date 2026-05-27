import apiClient from '@/lib/axios';
import { loadSettings } from '@/lib/settings';
import type {
  ReturnBase,
  ModelDiagnosisResponse,
  LabAnalysisResponse,
  ChatbotApiResponse,
} from '@/types/api';

/** Build multipart/form-data with Image + UserRole fields */
function buildImageForm(file: File, userRole: string): FormData {
  const form = new FormData();
  form.append('Image', file);
  form.append('UserRole', userRole);
  return form;
}

function getAiHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const { aiSensitivity } = loadSettings();
  return { 'X-AI-Sensitivity': String(aiSensitivity) };
}

export const aiService = {
  /**
   * POST /api/ai/GetBrainTumorDiagnose
   * multipart/form-data: Image (file) + UserRole (string)
   */
  diagnoseBrainTumor: async (
    file: File,
    userRole: string
  ): Promise<ReturnBase<ModelDiagnosisResponse>> => {
    const { data } = await apiClient.post<ReturnBase<ModelDiagnosisResponse>>(
      '/ai/GetBrainTumorDiagnose',
      buildImageForm(file, userRole),
      { headers: { ...getAiHeaders(), 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  /**
   * POST /api/ai/GetXRayDiagnose
   */
  diagnoseXRay: async (
    file: File,
    userRole: string
  ): Promise<ReturnBase<ModelDiagnosisResponse>> => {
    const { data } = await apiClient.post<ReturnBase<ModelDiagnosisResponse>>(
      '/ai/GetXRayDiagnose',
      buildImageForm(file, userRole),
      { headers: { ...getAiHeaders(), 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  /**
   * POST /api/ai/GetBreastCancerDiagnose
   */
  diagnoseBreastCancer: async (
    file: File,
    userRole: string
  ): Promise<ReturnBase<ModelDiagnosisResponse>> => {
    const { data } = await apiClient.post<ReturnBase<ModelDiagnosisResponse>>(
      '/ai/GetBreastCancerDiagnose',
      buildImageForm(file, userRole),
      { headers: { ...getAiHeaders(), 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  /**
   * POST /api/ai/GetDermatologyDiagnose
   */
  diagnoseDermatology: async (
    file: File,
    userRole: string
  ): Promise<ReturnBase<ModelDiagnosisResponse>> => {
    const { data } = await apiClient.post<ReturnBase<ModelDiagnosisResponse>>(
      '/ai/GetDermatologyDiagnose',
      buildImageForm(file, userRole),
      { headers: { ...getAiHeaders(), 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  /**
   * POST /api/ai/GetLabResults
   */
  analyzeLabResults: async (
    file: File,
    userRole: string
  ): Promise<ReturnBase<LabAnalysisResponse>> => {
    const { data } = await apiClient.post<ReturnBase<LabAnalysisResponse>>(
      '/ai/GetLabResults',
      buildImageForm(file, userRole),
      { headers: { ...getAiHeaders(), 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  /**
   * POST /api/ai/GetChatbotResponse
   * JSON body: { message, userRole }
   */
  chatbotMessage: async (
    message: string,
    userRole: string
  ): Promise<ReturnBase<ChatbotApiResponse>> => {
    const { data } = await apiClient.post<ReturnBase<ChatbotApiResponse>>(
      '/ai/GetChatbotResponse',
      { message, userRole }
    );
    return data;
  },
};

// ─── Streaming types ──────────────────────────────────────────────────────────

export interface AiStreamChunk {
  type: 'metadata' | 'text' | 'done';
  label?: string;
  label_ar?: string;
  confidence?: number;
  model?: string;
  text?: string;
}

// ─── Base URL for streaming (same .NET backend, different route prefix) ──────
const STREAM_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7196/api')
  .replace(/\/api\/?$/, '/api/ai-stream');

/** Read JWT from cookie — same logic as axios interceptor in lib/axios.ts */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const cookie = document.cookie.split(';').find(c => c.trim().startsWith('mediscan_token='));
  return cookie?.split('=')[1]?.trim() ?? null;
}

// ─── SSE streaming generator ─────────────────────────────────────────────────

export async function* streamAiEndpoint(
  action: string,
  body: FormData | Record<string, unknown>,
  signal?: AbortSignal
): AsyncGenerator<AiStreamChunk> {
  const url = `${STREAM_BASE}/${action}`;
  const isFormData = body instanceof FormData;
  const token = getAuthToken();

  const headers: Record<string, string> = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `bearer ${token}`;

  const res = await fetch(url, {
    method: 'POST',
    body: isFormData ? body : JSON.stringify(body),
    headers,
    signal,
  });

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
      } catch { /* malformed chunk — skip */ }
    }
  }
}
