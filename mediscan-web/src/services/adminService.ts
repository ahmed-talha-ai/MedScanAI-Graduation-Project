import apiClient from '@/lib/axios';
import type {
  ReturnBase,
  PatientsCountResponse,
  DoctorListEntry,
  DoctorForAppointment,
  TodayAppointmentEntry,
  RegisterDoctorPayload,
  RegisterAdminPayload,
  BookAppointmentByAdminPayload,
  ConfirmAppointmentPayload,
  CancelAppointmentPayload,
  DeleteDoctorPayload,
  RestoreDoctorPayload,
} from '@/types/api';

export const adminService = {
  /** GET /api/patient/GetPatientsCount — no auth required */
  getPatientsCount: async (): Promise<ReturnBase<PatientsCountResponse>> => {
    const { data } = await apiClient.get<ReturnBase<PatientsCountResponse>>(
      '/patient/GetPatientsCount'
    );
    return data;
  },

  /** GET /api/doctor/GetCount — Admin only — returns ReturnBase<int> */
  getDoctorsCount: async (): Promise<ReturnBase<number>> => {
    const { data } = await apiClient.get<ReturnBase<number>>('/doctor/GetCount');
    return data;
  },

  /**
   * GET /api/doctor/GetAll — Admin only
   * Returns base list: id, fullName, email, phoneNumber, isActive
   */
  getAllDoctors: async (): Promise<ReturnBase<DoctorListEntry[]>> => {
    const { data } = await apiClient.get<ReturnBase<DoctorListEntry[]>>('/doctor/GetAll');
    return data;
  },

  /**
   * GET /api/appointment/GetDoctors — Patient,Admin
   * Returns richer doctor info: specialization, yearsOfExperience
   * Used to merge into the doctor list for richer cards.
   */
  getDoctorsForAppointment: async (): Promise<ReturnBase<DoctorForAppointment[]>> => {
    const { data } = await apiClient.get<ReturnBase<DoctorForAppointment[]>>(
      '/appointment/GetDoctors'
    );
    return data;
  },

  /** GET /api/appointment/GetForToday — Admin only */
  getTodayAppointments: async (): Promise<ReturnBase<TodayAppointmentEntry[]>> => {
    const { data } = await apiClient.get<ReturnBase<TodayAppointmentEntry[]>>(
      '/appointment/GetForToday'
    );
    return data;
  },

  /** POST /api/authentication/RegisterDoctor — Admin only */
  registerDoctor: async (payload: RegisterDoctorPayload): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.post<ReturnBase<boolean>>(
      '/authentication/RegisterDoctor',
      payload
    );
    return data;
  },

  /** POST /api/authentication/RegisterAdmin — Admin only */
  registerAdmin: async (payload: RegisterAdminPayload): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.post<ReturnBase<boolean>>(
      '/authentication/RegisterAdmin',
      payload
    );
    return data;
  },

  /** POST /api/appointment/BookAppointmentByAdmin — Admin only */
  bookAppointmentByAdmin: async (
    payload: BookAppointmentByAdminPayload
  ): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.post<ReturnBase<boolean>>(
      '/appointment/BookAppointmentByAdmin',
      payload
    );
    return data;
  },

  /** POST /api/appointment/Confirm — Admin only */
  confirmAppointment: async (
    payload: ConfirmAppointmentPayload
  ): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.post<ReturnBase<boolean>>(
      '/appointment/Confirm',
      payload
    );
    return data;
  },

  /** PUT /api/appointment/Cancel — Patient,Admin */
  cancelAppointment: async (
    payload: CancelAppointmentPayload
  ): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.put<ReturnBase<boolean>>(
      '/appointment/Cancel',
      payload
    );
    return data;
  },

  /** POST /api/doctor/DeleteDoctor — Admin,Doctor (soft-delete / deactivate) */
  deleteDoctor: async (payload: DeleteDoctorPayload): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.post<ReturnBase<boolean>>(
      '/doctor/DeleteDoctor',
      payload
    );
    return data;
  },

  /** POST /api/doctor/RestoreDoctor — Admin,Doctor (reactivate) */
  restoreDoctor: async (payload: RestoreDoctorPayload): Promise<ReturnBase<boolean>> => {
    const { data } = await apiClient.post<ReturnBase<boolean>>(
      '/doctor/RestoreDoctor',
      payload
    );
    return data;
  },
};
