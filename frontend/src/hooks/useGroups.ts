import { api } from '@/lib/api';
import { useFetch } from './useFetch';
import type { CommunityGroup, CommunityEvent } from '@shared/types';

export function useGroups() {
  return useFetch<CommunityGroup[]>(() => api.get<CommunityGroup[]>('/community/groups'), []);
}

export function useGroup(slug: string | undefined) {
  return useFetch<CommunityGroup>(() => api.get<CommunityGroup>(`/community/groups/${slug}`), [slug]);
}

export function useEvents() {
  return useFetch<CommunityEvent[]>(() => api.get<CommunityEvent[]>('/community/events'), []);
}
