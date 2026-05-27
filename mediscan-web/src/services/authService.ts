import apiClient from '@/lib/axios';
import type {
  ReturnBase,
  LoginPayload,
  RegisterPatientPayload,
  ResetPasswordEmailPayload,
  ResetPasswordPayload,
  RefreshTokenPayload,
  ChangePasswordPayload,
} from '@/types/api';

const BASE = '/authentication';

export const authService = {
  login: (payload: LoginPayload): Promise<ReturnBase<string>> =>
    apiClient.post(`${BASE}/Login`, payload).then((r) => r.data),

  registerPatient: (payload: RegisterPatientPayload): Promise<ReturnBase<boolean>> =>
    apiClient.post(`${BASE}/RegisterPatient`, payload).then((r) => r.data),

  resetPasswordEmail: (payload: ResetPasswordEmailPayload): Promise<ReturnBase<boolean>> =>
    apiClient.post(`${BASE}/ResetPasswordEmail`, payload).then((r) => r.data),

  resetPassword: (payload: ResetPasswordPayload): Promise<ReturnBase<boolean>> =>
    apiClient.post(`${BASE}/ResetPassword`, payload).then((r) => r.data),

  refreshToken: (payload: RefreshTokenPayload): Promise<ReturnBase<string>> =>
    apiClient.post(`${BASE}/RefreshToken`, payload).then((r) => r.data),

  changePassword: (payload: ChangePasswordPayload): Promise<ReturnBase<boolean>> =>
    apiClient.post(`${BASE}/ChangePassword`, payload).then((r) => r.data),

  confirmEmail: (userId: string, token: string): Promise<ReturnBase<boolean>> =>
    apiClient
      .get(`${BASE}/ConfirmEmail`, { params: { UserId: userId, Token: token } })
      .then((r) => r.data),
};
