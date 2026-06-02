import { api } from '@/lib/api';
import { useFetch } from './useFetch';
import type { Payout } from '@shared/types';

export function usePayouts() {
  return useFetch<Payout[]>(() => api.get<Payout[]>('/payouts'), []);
}
