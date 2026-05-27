import apiClient from '@/lib/axios';
import type { NotificationItem } from '@/types/api';

interface NotificationResponse {
  succeeded: boolean;
  data: NotificationItem[];
  message: string;
}

export const notificationService = {
  /**
   * GET /api/notifications/GetUserNotifications
   * No parameters required.
   */
  getUserNotifications: async (): Promise<NotificationItem[]> => {
    const { data } = await apiClient.get<NotificationResponse>(
      '/notifications/GetUserNotifications'
    );
    return data?.data ?? [];
  },
};
