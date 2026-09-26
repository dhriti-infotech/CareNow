import apiClient from '@/api/client';
import { downloadAuthenticatedImage } from '@/api/authenticatedImage';
import type { NurseServiceRequestStatus } from '@/api/patientRequests';

export type PatientNurseLiveLocation = {
  requestId: string;
  professionalId: string;
  professionalName: string;
  status: NurseServiceRequestStatus;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lastLocationUpdatedAt?: string | null;
};

export const getPatientNurseLiveLocation = async (requestId: string) =>
  (await apiClient.get<PatientNurseLiveLocation>(
    `/api/user/patient/requests/${requestId}/nurse-location`
  )).data;

export const getAssignedNursePictureSource = async (requestId: string, version: number) =>
  downloadAuthenticatedImage(
    `/api/user/patient/requests/${requestId}/professional-picture?v=${version}`,
    `nurse-${requestId}-${version}`,
  );
