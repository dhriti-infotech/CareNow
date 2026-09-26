import axios, { type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '@/config/env';
import { AuthStorage } from '@/services/auth-storage';
import type { ApiError } from '@/types/auth';

const PUBLIC_AUTH_PATHS = [
  '/api/user-auth/register',
  '/api/professional-auth/register',
  '/api/unified-auth/login/',
];

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

console.log('[CareNow API] Base URL:', API_BASE_URL);

let sessionExpiredHandler: (() => void) | null = null;
let isSessionExpiryHandling = false;

export const setSessionExpiredHandler = (handler: () => void) => {
  sessionExpiredHandler = handler;
};

export const normalizeApiError = (error: any): ApiError => {
  if (error && typeof error === 'object' && typeof error.code === 'string' && typeof error.message === 'string' && !error.response) {
    return error as ApiError;
  }
  const backendError = error?.response?.data;

  if (backendError && typeof backendError === 'object' && 'code' in backendError) {
    console.log('[CareNow API] Backend error response:', {
      code: backendError.code,
      status: error?.response?.status,
      url: error?.config?.url,
    });

    return {
      code: String(backendError.code ?? 'UNKNOWN_ERROR'),
      // Preserve the backend's specific message. The old implementation
      // replaced every 409 with the registration duplicate-account message,
      // which hid payment/availability errors returned by request APIs.
      message: typeof backendError.message === 'string' && backendError.message.trim()
        ? backendError.message
        : messageForStatus(error?.response?.status),
      timestamp: typeof backendError.timestamp === 'string' ? backendError.timestamp : undefined,
    };
  }

  const message = error?.message === 'Network Error' || error?.code === 'ECONNABORTED'
    ? 'Unable to connect to CareNow. Please check your connection and try again.'
    : messageForStatus(error?.response?.status);

  console.log('[CareNow API] Network/request error:', {
    message: error?.message,
    status: error?.response?.status,
    url: error?.config?.url,
    stack: error?.stack,
  });

  return {
    code: 'NETWORK_ERROR',
    message,
  };
};

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const url = config.url ?? '';
  const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) => url.includes(path));

  console.log('[CareNow API] Request:', {
    method: config.method?.toUpperCase(),
    url: `${config.baseURL ?? ''}${config.url ?? ''}`,
    publicAuth: isPublicAuthRequest,
  });

  if (!isPublicAuthRequest) {
    const token = await AuthStorage.getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log('[CareNow API] Response:', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  async (error) => {
    const status = error?.response?.status;

    console.log('[CareNow API] Response error:', {
      status,
      url: error?.config?.url,
      message: error?.message,
      data: error?.response?.data,
    });

    const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) => (error?.config?.url ?? '').includes(path));
    if (status === 401 && !isPublicAuthRequest && !isSessionExpiryHandling) {
      isSessionExpiryHandling = true;

      try {
        await AuthStorage.removeToken();
        await AuthStorage.removeUser();
        sessionExpiredHandler?.();
      } finally {
        setTimeout(() => {
          isSessionExpiryHandling = false;
        }, 500);
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);

export default apiClient;

function messageForStatus(status?: number, fallback = 'Something went wrong. Please try again.') {
  if (status === 409) return 'An account with this mobile number or email already exists.';
  if (status === 401) return 'Invalid OTP or session. Please try again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'We could not find that account.';
  if (status && status >= 500) return 'The CareNow server is unavailable. Please try again shortly.';
  return fallback;
}
