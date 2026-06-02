import { api } from '@/lib/api';
import { useFetch } from './useFetch';
import type { Notification } from '@shared/types';

interface NotificationsResponse {
  items: Notification[];
  unread: number;
}

export function useNotifications() {
  return useFetch<NotificationsResponse>(
    () => api.get<NotificationsResponse>('/notifications'),
    [],
  );
}
