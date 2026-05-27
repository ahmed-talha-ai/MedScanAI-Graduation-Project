import { ReturnBase, SubmitWebsiteReviewPayload, WebsiteReviewResponse } from '@/types/api';
import apiClient from '@/lib/axios';

const BASE = '/review';

export const reviewService = {
  submitReview: async (payload: SubmitWebsiteReviewPayload): Promise<ReturnBase<boolean>> => {
    const res = await apiClient.post(`${BASE}/Submit`, payload);
    return res.data;
  },

  getAllReviews: async (): Promise<ReturnBase<WebsiteReviewResponse[]>> => {
    const res = await apiClient.get(`${BASE}/GetAll`);
    return res.data;
  }
};
