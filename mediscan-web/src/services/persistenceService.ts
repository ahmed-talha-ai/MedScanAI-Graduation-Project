import apiClient from '@/lib/axios';

// ─── Diagnosis persistence ─────────────────────────────────────────────────
export async function saveDiagnosisResult(payload: {
  patientId: string;
  modelType: string;        // "BrainTumor" | "ChestXRay" | "BreastCancer" | "SkinDisease" | "LabOCR"
  resultLabel: string;
  confidenceScore: number;
  resultText: string;
  inputImagePath?: string;
}) {
  await apiClient.post('/diagnosis/save', payload);
}

export async function getDiagnosisHistory(patientId: string) {
  const { data } = await apiClient.get(`/diagnosis/history/${patientId}`);
  return data;
}

// ─── Report persistence (uses existing AIReport entity) ────────────────────
export async function saveReport(payload: {
  patientId: string;
  report: string;            // matches AIReport.Report field name
  appointmentId?: number;
}) {
  await apiClient.post('/report/save', payload);
}

export async function getReportHistory(patientId: string) {
  const { data } = await apiClient.get(`/report/history/${patientId}`);
  return data;
}

// ─── Chat persistence (uses existing AIChatSession/AIChatMessage entities) ─
export async function startChatSession(patientId: string, languageUsed: string = 'ar'): Promise<number> {
  const { data } = await apiClient.post('/chat/session/start', { patientId, languageUsed });
  return data.data;  // returns int sessionId (AIChatSession.Id is int, not Guid)
}

export async function saveChatMessage(payload: {
  sessionId: number;          // int, not Guid
  senderType: 'Patient' | 'AI';  // matches AIChatMessage.SenderType field
  messageText: string;        // matches AIChatMessage.MessageText field
}) {
  await apiClient.post('/chat/message/save', payload);
}

export async function getChatHistory(patientId: string) {
  const { data } = await apiClient.get(`/chat/history/${patientId}`);
  return data;
}
