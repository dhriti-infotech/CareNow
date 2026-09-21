import apiClient from './client';

export type NurseRequestPriority = 'NORMAL' | 'URGENT';
export type NurseServiceRequestStatus =
  | 'SEARCHING'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type CreateNurseServiceRequest = {
  serviceType: string;
  patientName: string;
  patientAge?: number | null;
  locationAddress: string;
  latitude: number;
  longitude: number;
  offeredPrice: number;
  paymentMethod: PaymentMethod;
  priority: NurseRequestPriority;
  notes?: string;
};

export type PaymentMethod = 'UPI' | 'COD';

export type PatientServiceRequest = {
  requestId: string;
  patientProfileId: string;
  patientName: string;
  patientAge?: number | null;
  serviceType: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  offeredPrice: number;
  paymentMethod: PaymentMethod;
  completionPasscode?: string | null;
  priority: NurseRequestPriority;
  notes?: string | null;
  status: NurseServiceRequestStatus;
  professionalId?: string | null;
  professionalName?: string | null;
  requestedAt: string;
  acceptedAt?: string | null;
  completedAt?: string | null;
};

export type PatientNurseOffer = {
  offerId: string;
  requestId: string;
  professionalId: string;
  professionalName: string;
  professionalType: string;
  qualification?: string | null;
  serviceArea?: string | null;
  distanceKm?: number | null;
  price?: number | null;
  status: 'OFFERED' | 'DECLINED' | 'ACCEPTED' | 'EXPIRED';
  offeredAt: string;
  respondedAt?: string | null;
};

export const createNurseRequest = async (request: CreateNurseServiceRequest) =>
  (await apiClient.post<PatientServiceRequest>('/api/user/patient/requests', request)).data;


export type AvailableProfessional = {
  professionalId: string;
  name: string;
  profession: string;
  age?: number | null;
  experienceYears?: number | null;
  rating: number;
  ratingCount: number;
  distanceKm: number;
  price: number;
};

export const getAvailableProfessionals = async (requestId: string) =>
  (await apiClient.get<AvailableProfessional[]>(`/api/user/patient/requests/${requestId}/available-professionals`)).data;

export const continuePatientMatching = async (requestId: string) =>
  (await apiClient.post<PatientServiceRequest>(`/api/user/patient/requests/${requestId}/continue`)).data;

export const getPatientRequests = async () =>
  (await apiClient.get<PatientServiceRequest[]>('/api/user/patient/requests')).data;

export const getPatientRequest = async (requestId: string) =>
  (await apiClient.get<PatientServiceRequest>(`/api/user/patient/requests/${requestId}`)).data;

export const getPatientRequestOffers = async (requestId: string) =>
  (await apiClient.get<PatientNurseOffer[]>(`/api/user/patient/requests/${requestId}/offers`)).data;

export const cancelPatientRequest = async (requestId: string) =>
  (await apiClient.post<PatientServiceRequest>(`/api/user/patient/requests/${requestId}/cancel`)).data;


export type CreateNurseRatingRequest = {
  rating: number;
  review?: string;
};

export const ratePatientRequest = async (requestId: string, input: CreateNurseRatingRequest) =>
  (await apiClient.post<PatientServiceRequest>(`/api/user/patient/requests/${requestId}/rating`, input)).data;
