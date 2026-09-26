import apiClient from '@/api/client';

export type NurseServicePrice = {
  serviceType: string;
  price: number;
  currency: string;
  updatedAt: string;
};

export const getNurseServicePricing = async () =>
  (await apiClient.get<NurseServicePrice[]>('/api/user/patient/service-pricing')).data;
