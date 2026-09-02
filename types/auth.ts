export type UserRole = string;

export type AuthUser = {
  id: string | number;
  email: string;
  role: string;
  professionalType?: string;
};

export type EmailRequest = {
  email: string;
};

export type VerifyOtpRequest = {
  email: string;
  otp: string;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
};

export type ApiError = {
  code: string;
  message: string;
  timestamp?: string;
};

export type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  user: AuthUser | null;
};
