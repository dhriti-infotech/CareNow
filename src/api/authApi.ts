import apiClient from '@/api/client';

import type { AuthResponse, LoginOtpRequest, ProfessionalProfile, ProfessionalRegistrationRequest, RegistrationResponse, UserProfile, UserRegistrationRequest, VerifyMobileRequest } from '@/types/auth';

export const registerUser = async (request: UserRegistrationRequest) => (await apiClient.post<RegistrationResponse>('/api/user-auth/register', request)).data;
export const verifyUserMobile = async (request: VerifyMobileRequest) => (await apiClient.post<UserProfile>('/api/user-auth/register/verify-mobile', request)).data;
export const registerProfessional = async (request: ProfessionalRegistrationRequest) => (await apiClient.post<RegistrationResponse>('/api/professional-auth/register', request)).data;
export const verifyProfessionalMobile = async (request: VerifyMobileRequest) => (await apiClient.post<ProfessionalProfile>('/api/professional-auth/register/verify-mobile', request)).data;
export const sendLoginOtp = async (identifier: string) => (await apiClient.post<{ message: string }>('/api/unified-auth/login/send-otp', { identifier: identifier.trim() } satisfies LoginOtpRequest)).data;
export const verifyLoginOtp = async (identifier: string, otp: string) => (await apiClient.post<AuthResponse>('/api/unified-auth/login/verify-otp', { identifier: identifier.trim(), otp } satisfies LoginOtpRequest)).data;
export const getUserProfile = async (accountId: string) => (await apiClient.get<UserProfile>(`/api/user-auth/account/${accountId}`)).data;
export const getProfessionalProfile = async (accountId: string) => (await apiClient.get<ProfessionalProfile>(`/api/professional-auth/account/${accountId}`)).data;

// The legacy email-only registration flow is intentionally unsupported by the
// current backend, which requires name and mobile during registration.
export async function sendRegistrationOtp(_email: string): Promise<{ message: string }> {
  throw { code: 'REGISTRATION_DETAILS_REQUIRED', message: 'Please complete registration with your name and mobile number.' };
}

export async function verifyRegistrationOtp(_email: string, _otp: string): Promise<AuthResponse> {
  throw { code: 'REGISTRATION_DETAILS_REQUIRED', message: 'Please complete registration with your name and mobile number.' };
}
