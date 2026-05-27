import apiClient from '@/lib/axios';
import type {
  ReturnBase,
  DoctorDashboardResponse,
  CompleteAppointmentPayload,
} from '@/types/api';

export const doctorService = {
  /**
   * GET /api/doctor/GetInfoAndAppointments
   * [FromQuery] { DoctorId }
   * Returns doctor name + full patient/appointment list in one call.
   */
  getDashboard: async (doctorId: string): Promise<ReturnBase<DoctorDashboardResponse>> => {
    const { data } = await apiClient.get<ReturnBase<DoctorDashboardResponse>>(
      '/doctor/GetInfoAndAppointments',
      { params: { DoctorId: doctorId } }
    );
    return data;
  },

  /**
   * PUT /api/appointment/Complete
   * [FromBody] CompleteAppointmentCommand { AppointmentId }
   * Doctor role only.
   */
  completeAppointment: async (payload: CompleteAppointmentPayload): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.put<ReturnBase<boolean>>(
      '/appointment/Complete',
      payload
    );
    return data;
  },
};
