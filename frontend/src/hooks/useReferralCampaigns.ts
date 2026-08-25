import { api } from '@/lib/api';
import { useFetch } from './useFetch';

/** Una campaña = un mensaje de WhatsApp + la tarjeta que verá quien lo reciba. */
export interface ReferralCampaign {
  key: string;
  label: string;
  title: string;
  description: string;
  image: string;
  message: string;
  to: string;
}

export function useReferralCampaigns() {
  return useFetch<ReferralCampaign[]>(
    () => api.get<ReferralCampaign[]>('/referral/campaigns'),
    [],
  );
}
