export type AccountRole = 'USER' | 'PROFESSIONAL';
export type ProfessionalType = 'NURSE' | 'COMPOUNDER' | 'HEALTHCARE_WORKER' | 'PHARMACIST';
export type ProfessionalVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AuthSession = {
  accessToken: string; tokenType: string; accountId: string; profileId: string;
  role: AccountRole; name: string; email: string; mobile: string;
  professionalType: ProfessionalType | null;
  verificationStatus: ProfessionalVerificationStatus | null;
};
export type AuthUser = Omit<AuthSession, 'accessToken' | 'tokenType'> & {
  qualification?: string;
  registrationNumber?: string;
  serviceArea?: string;
};
export type AuthResponse = AuthSession;
export type UserRegistrationRequest = { name: string; email: string; mobile: string; address?: string };
export type ProfessionalRegistrationRequest = { professionalType: ProfessionalType; fullName: string; email: string; mobile: string; qualification: string; registrationNumber: string; serviceArea: string };
export type RegistrationResponse = { accountId: string; userProfileId?: string; professionalId?: string; message: string; professionalType?: ProfessionalType; verificationStatus?: ProfessionalVerificationStatus };
export type VerifyMobileRequest = { mobile: string; otp: string };
export type LoginOtpRequest = { identifier: string; otp?: string };
export type UserProfile = Omit<AuthUser, 'role' | 'professionalType' | 'verificationStatus' | 'profileId'> & { userProfileId: string; address?: string; mobileVerified: boolean };
export type ProfessionalProfile = Omit<AuthUser, 'role' | 'profileId'> & { professionalId: string; qualification: string; registrationNumber: string; serviceArea: string; mobileVerified: boolean; professionalType: ProfessionalType; verificationStatus: ProfessionalVerificationStatus };
export type PendingRegistration = { kind: 'USER' | 'PROFESSIONAL'; mobile: string };

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
