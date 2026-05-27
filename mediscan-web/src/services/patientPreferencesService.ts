import apiClient from '@/lib/axios';

export interface PatientPreferences {
  isAppointmentNotificationEnabled: boolean;
  isCampaignNotificationEnabled: boolean;
  preferredLanguage: string;
}

export const patientPreferencesService = {
  getPreferences: async (): Promise<PatientPreferences> => {
    const response = await apiClient.get<{ data: PatientPreferences }>('/patient/preferences');
    return response.data.data;
  },

  updatePreferences: async (preferences: PatientPreferences): Promise<void> => {
    await apiClient.put<void>('/patient/preferences', preferences);
  }
};
