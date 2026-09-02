import axios, { type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '../config/env';
import { AuthStorage } from '../services/auth-storage';
import type { ApiError } from '../types/auth';

const PUBLIC_AUTH_PATHS = [
  '/api/auth/register/send-otp',
  '/api/auth/register/verify-otp',
  '/api/auth/login/send-otp',
  '/api/auth/login/verify-otp',
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
  const backendError = error?.response?.data;

  if (backendError && typeof backendError === 'object' && 'code' in backendError) {
    console.log('[CareNow API] Backend error response:', {
      code: backendError.code,
      status: error?.response?.status,
      url: error?.config?.url,
    });

    return {
      code: String(backendError.code ?? 'UNKNOWN_ERROR'),
      message: String(backendError.message ?? 'Something went wrong.'),
      timestamp: typeof backendError.timestamp === 'string' ? backendError.timestamp : undefined,
    };
  }

  const message = error?.message === 'Network Error'
    ? 'Unable to connect to CareNow. Please check your internet connection and try again.'
    : 'Unable to connect to CareNow. Please try again.';

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

    if (status === 401 && !isSessionExpiryHandling) {
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
