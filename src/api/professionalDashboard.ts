import apiClient from '@/api/client';

export type DashboardRequest = {
  requestId: string;
  patientName: string;
  patientAge?: number | null;
  serviceType: string;
  locationAddress: string;
  latitude: number | string | null;
  longitude: number | string | null;
  distanceKm?: number | null;
  offeredPrice: number;
  requestedAt: string;
  priority: 'NORMAL' | 'URGENT';
  notes?: string | null;
  status: 'SEARCHING' | 'OFFERED' | 'ACCEPTED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
};

export type NurseActivity = {
  requestId: string;
  patientName: string;
  serviceType: string;
  activityAt: string;
  activityStatus: 'OFFERED' | 'DECLINED' | 'EXPIRED' | 'ACCEPTED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED';
  requestStatus: string;
  offeredPrice: number;
};

export type NurseDashboard = {
  professionalId: string;
  name: string;
  professionalType: string;
  verificationStatus: string;
  availabilityStatus: 'OFFLINE' | 'AVAILABLE' | 'BUSY';
  earnings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lifetime: number;
    pendingCharges: number;
    netEarnings: number;
  };
  serviceActivity: {
    requestsReceived: number;
    servicesCompleted: number;
    activeRequests: number;
    completionRate: number;
  };
  rating: {
    average: number;
    totalRatings: number;
  };
  newServiceRequests: DashboardRequest[];
  activeServices: DashboardRequest[];
  recentActivities: NurseActivity[];
};

export const getNurseDashboard = async () =>
  (await apiClient.get<NurseDashboard>('/api/professional-nurse/dashboard')).data;
