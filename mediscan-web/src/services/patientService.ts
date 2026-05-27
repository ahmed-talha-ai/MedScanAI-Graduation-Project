import apiClient from '@/lib/axios';
import type {
  ReturnBase,
  PatientProfileResponse,
  UpdatePatientProfilePayload,
  AddMedicalHistoryPayload,
  DeleteMedicalHistoryPayload,
} from '@/types/api';

export const patientService = {
  // ─── Profile ──────────────────────────────────────────────────────────────

  /**
   * POST /api/patient/GetProfile
   * [FromBody] { patientId }
   */
  getProfile: async (patientId: string): Promise<ReturnBase<PatientProfileResponse>> => {
    const { data } = await apiClient.post<ReturnBase<PatientProfileResponse>>(
      '/patient/GetProfile',
      { patientId }
    );
    return data;
  },

  /**
   * PUT /api/patient/UpdateProfile
   * [FromBody] UpdatePatientProfileCommand — all fields optional except id
   */
  updateProfile: async (payload: UpdatePatientProfilePayload): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.put<ReturnBase<boolean>>(
      '/patient/UpdateProfile',
      payload
    );
    return data;
  },

  // ─── Allergies ────────────────────────────────────────────────────────────

  /**
   * POST /api/allergy/AddAllergy
   * [FromBody] AddAllergyCommand { patientId, name }
   */
  addAllergy: async (payload: AddMedicalHistoryPayload): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.post<ReturnBase<boolean>>(
      '/allergy/AddAllergy',
      payload
    );
    return data;
  },

  /**
   * DELETE /api/allergy/DeleteAllergy
   * [FromBody] DeletePatientAllergyCommand { id }
   */
  deleteAllergy: async (payload: DeleteMedicalHistoryPayload): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.delete<ReturnBase<boolean>>(
      '/allergy/DeleteAllergy',
      { data: payload }
    );
    return data;
  },

  // ─── Chronic Diseases ─────────────────────────────────────────────────────

  /**
   * POST /api/chronicdisease/AddChronicDisease
   * [FromBody] AddChronicDiseaseCommand { patientId, name }
   */
  addChronicDisease: async (payload: AddMedicalHistoryPayload): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.post<ReturnBase<boolean>>(
      '/chronicdisease/AddChronicDisease',
      payload
    );
    return data;
  },

  /**
   * DELETE /api/chronicdisease/DeleteChronicDisease
   * [FromBody] DeletePatientChronicDiseaseCommand { id }
   */
  deleteChronicDisease: async (payload: DeleteMedicalHistoryPayload): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.delete<ReturnBase<boolean>>(
      '/chronicdisease/DeleteChronicDisease',
      { data: payload }
    );
    return data;
  },

  // ─── Medications ──────────────────────────────────────────────────────────

  /**
   * POST /api/currentmedication/AddCurrentMedication
   * [FromBody] AddCurrentMedicationCommand { patientId, name }
   */
  addMedication: async (payload: AddMedicalHistoryPayload): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.post<ReturnBase<boolean>>(
      '/currentmedication/AddCurrentMedication',
      payload
    );
    return data;
  },

  /**
   * DELETE /api/currentmedication/DeleteCurrentMedication
   * [FromBody] DeletePatientCurrentMedicationCommand { id }
   */
  deleteMedication: async (payload: DeleteMedicalHistoryPayload): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.delete<ReturnBase<boolean>>(
      '/currentmedication/DeleteCurrentMedication',
      { data: payload }
    );
    return data;
  },

  // ─── Family History ───────────────────────────────────────────────────────

  /**
   * POST /api/familyhistory/AddFamilyHistory
   * [FromBody] AddFamilyHistoryCommand { patientId, name }
   */
  addFamilyHistory: async (payload: AddMedicalHistoryPayload): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.post<ReturnBase<boolean>>(
      '/familyhistory/AddFamilyHistory',
      payload
    );
    return data;
  },

  /**
   * DELETE /api/familyhistory/DeleteFamilyHistory
   * [FromBody] DeletePatientFamilyHistoryCommand { id }
   */
  deleteFamilyHistory: async (payload: DeleteMedicalHistoryPayload): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.delete<ReturnBase<boolean>>(
      '/familyhistory/DeleteFamilyHistory',
      { data: payload }
    );
    return data;
  },
};
