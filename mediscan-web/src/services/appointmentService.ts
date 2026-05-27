import apiClient from '@/lib/axios';
import type {
  ReturnBase,
  AppointmentResponse,
  BookAppointmentPayload,
  DoctorForAppointment,
} from '@/types/api';

export const appointmentService = {
  /**
   * GET /api/appointment/GetPatientAppointments?PatientId={patientId}
   */
  getPatientAppointments: async (
    patientId: string
  ): Promise<ReturnBase<AppointmentResponse[]>> => {
    const { data } = await apiClient.get<ReturnBase<AppointmentResponse[]>>(
      '/appointment/GetPatientAppointments',
      { params: { PatientId: patientId } }
    );
    return data;
  },

  /**
   * GET /api/appointment/GetDoctors
   */
  getDoctors: async (): Promise<ReturnBase<DoctorForAppointment[]>> => {
    const { data } = await apiClient.get<ReturnBase<DoctorForAppointment[]>>(
      '/appointment/GetDoctors'
    );
    return data;
  },

  /**
   * POST /api/appointment/BookAppointment
   * [FromBody] BookAppointmentCommand
   */
  bookAppointment: async (
    payload: BookAppointmentPayload
  ): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.post<ReturnBase<boolean>>(
      '/appointment/BookAppointment',
      payload
    );
    return data;
  },

  /**
   * PUT /api/appointment/Cancel
   * [FromBody] { appointmentId }
   */
  cancelAppointment: async (
    appointmentId: number
  ): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.put<ReturnBase<boolean>>(
      '/appointment/Cancel',
      { appointmentId }
    );
    return data;
  },
};
