import { api } from '@/lib/api';
import { useFetch } from './useFetch';
import type { ReferralRow, ReferralTreeResponse } from '@shared/types';

export function useReferrals() {
  return useFetch<ReferralRow[]>(() => api.get<ReferralRow[]>('/referrals'), []);
}

export function useReferralTree() {
  return useFetch<ReferralTreeResponse>(
    () => api.get<ReferralTreeResponse>('/referrals/tree'),
    [],
  );
}
