import apiClient from './client';

import type { AuthResponse, AuthUser, EmailRequest, VerifyOtpRequest } from '../types/auth';

export async function sendRegistrationOtp(email: string): Promise<{ message: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const response = await apiClient.post<{ message: string }>('/api/auth/register/send-otp', {
    email: normalizedEmail,
  } satisfies EmailRequest);

  return response.data;
}

export async function verifyRegistrationOtp(email: string, otp: string): Promise<AuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();
  const response = await apiClient.post<AuthResponse>('/api/auth/register/verify-otp', {
    email: normalizedEmail,
    otp,
  } satisfies VerifyOtpRequest);

  return response.data;
}

export async function sendLoginOtp(email: string): Promise<{ message: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const response = await apiClient.post<{ message: string }>('/api/auth/login/send-otp', {
    email: normalizedEmail,
  } satisfies EmailRequest);

  console.log('[CareNow API] sendLoginOtp response:', response.data);
  return response.data;
}

export async function verifyLoginOtp(email: string, otp: string): Promise<AuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();
  const response = await apiClient.post<AuthResponse>('/api/auth/login/verify-otp', {
    email: normalizedEmail,
    otp,
  } satisfies VerifyOtpRequest);

  console.log('[CareNow API] verifyLoginOtp response:', response.data);
  return response.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>('/api/auth/me');
  return response.data;
}
