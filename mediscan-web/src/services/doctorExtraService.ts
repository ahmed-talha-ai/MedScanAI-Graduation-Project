import { ReturnBase, UpdateDoctorExtraPayload, DoctorExtraResponse, SubmitDoctorReviewPayload, DoctorReviewResponse } from '@/types/api';
import apiClient from '@/lib/axios';

const BASE = '/doctor';

export const doctorExtraService = {
  updateExtra: async (payload: UpdateDoctorExtraPayload): Promise<ReturnBase<boolean>> => {
    const res = await apiClient.post(`${BASE}/UpdateExtra`, payload);
    return res.data;
  },

  getExtra: async (doctorId: string): Promise<ReturnBase<DoctorExtraResponse>> => {
    const res = await apiClient.get(`${BASE}/GetExtra/${doctorId}`);
    return res.data;
  },

  submitReview: async (payload: SubmitDoctorReviewPayload): Promise<ReturnBase<boolean>> => {
    const res = await apiClient.post(`${BASE}/SubmitReview`, payload);
    return res.data;
  },

  getReviews: async (doctorId: string): Promise<ReturnBase<DoctorReviewResponse[]>> => {
    const res = await apiClient.get(`${BASE}/GetReviews/${doctorId}`);
    return res.data;
  }
};
