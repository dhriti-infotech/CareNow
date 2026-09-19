import apiClient from './client';

export type NurseServiceRequest = {
  requestId: string;
  patientName: string;
  patientAge?: number | null;
  serviceType: string;
  locationAddress: string;
  distanceKm?: number | null;
  offeredPrice: number;
  requestedAt: string;
  priority: 'NORMAL' | 'URGENT';
  notes?: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  status: 'SEARCHING' | 'OFFERED' | 'ACCEPTED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
};

export type NurseAvailabilityStatus = 'OFFLINE' | 'AVAILABLE' | 'BUSY';

export type NurseProfile = {
  accountId: string;
  professionalId: string;
  name: string;
  email: string;
  mobile: string;
  professionalType: string;
  qualification?: string | null;
  registrationNumber?: string | null;
  serviceArea?: string | null;
  verificationStatus: string;
  availabilityStatus: NurseAvailabilityStatus;
  latitude?: number | string | null;
  longitude?: number | string | null;
  serviceRadiusKm?: number | string | null;
};

export const getNurseProfile = async () =>
  (await apiClient.get<NurseProfile>('/api/professional-nurse/me')).data;

export const registerNursePushToken = async (payload: {
  deviceId: string;
  pushToken: string;
  platform: string;
}) =>
  (await apiClient.post<{ message: string }>('/api/professional-nurse/notifications/push-token', payload)).data;

export const updateNurseAvailability = async (payload: {
  availabilityStatus: NurseAvailabilityStatus;
  latitude?: number | null;
  longitude?: number | null;
  serviceRadiusKm?: number | null;
}) =>
  (await apiClient.patch<NurseProfile>('/api/professional-nurse/availability', payload)).data;

export const updateNurseLocation = async (payload: {
  latitude: number;
  longitude: number;
}) =>
  (await apiClient.patch<NurseProfile>('/api/professional-nurse/location', payload)).data;

export const getNurseRequests = async () =>
  (await apiClient.get<NurseServiceRequest[]>('/api/professional-nurse/requests')).data;

export const getNurseRequest = async (requestId: string) =>
  (await apiClient.get<NurseServiceRequest>(`/api/professional-nurse/requests/${requestId}`)).data;

export const acceptNurseRequest = async (requestId: string) =>
  (await apiClient.post<NurseServiceRequest>(`/api/professional-nurse/requests/${requestId}/accept`)).data;

export const declineNurseRequest = async (requestId: string) =>
  (await apiClient.post<{ message: string }>(`/api/professional-nurse/requests/${requestId}/decline`)).data;


export type NurseServiceStatus = 'EN_ROUTE' | 'ARRIVED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED';

export const updateNurseServiceStatus = async (requestId: string, status: NurseServiceStatus) =>
  (await apiClient.patch<NurseServiceRequest>(`/api/professional-nurse/requests/${requestId}/status`, { status })).data;
