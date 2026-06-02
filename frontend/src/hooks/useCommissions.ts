import { api } from '@/lib/api';
import { useFetch } from './useFetch';
import type { Commission, CommissionSummary } from '@shared/types';

export function useCommissions() {
  return useFetch<Commission[]>(() => api.get<Commission[]>('/commissions'), []);
}

export function useCommissionSummary() {
  return useFetch<CommissionSummary>(
    () => api.get<CommissionSummary>('/commissions/summary'),
    [],
  );
}
