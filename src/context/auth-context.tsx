import { router } from 'expo-router';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { getProfessionalProfile, getUserProfile } from '@/api/authApi';
import { setSessionExpiredHandler } from '@/api/client';
import { AuthStorage } from '@/services/auth-storage';
import type { AuthResponse, AuthState, AuthUser } from '@/types/auth';

const initialState: AuthState = {
  isLoading: true,
  isAuthenticated: false,
  accessToken: null,
  user: null,
};

type AuthContextValue = AuthState & {
  login: (authResponse: AuthResponse) => Promise<void>;
  logout: (options?: { redirect?: boolean }) => Promise<void>;
  restoreSession: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  refreshProfessionalStatus: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  const logout = useCallback(async (options?: { redirect?: boolean }) => {
    await AuthStorage.clear();
    setState({
      isLoading: false,
      isAuthenticated: false,
      accessToken: null,
      user: null,
    });

    if (options?.redirect !== false) {
      router.replace('/login');
    }
  }, []);

  const login = useCallback(async (authResponse: AuthResponse) => {
    const { accessToken, tokenType, ...normalizedUser } = authResponse;
    await AuthStorage.saveSession({ ...authResponse, role: authResponse.role });

    setState({
      isLoading: false,
      isAuthenticated: true,
      accessToken,
      user: normalizedUser,
    });
  }, []);

  const restoreSession = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true }));

    const session = await AuthStorage.getSession();
    if (!session) {
      setState({
        isLoading: false,
        isAuthenticated: false,
        accessToken: null,
        user: null,
      });
      return;
    }

    try {
      let user: AuthUser;
      if (session.role === 'PROFESSIONAL') {
        const profile = await getProfessionalProfile(session.accountId);
        user = { ...session, ...profile, role: 'PROFESSIONAL', profileId: profile.professionalId };
      } else {
        const profile = await getUserProfile(session.accountId);
        user = { ...session, ...profile, role: 'USER', profileId: profile.userProfileId, professionalType: null, verificationStatus: null };
      }
      await AuthStorage.saveSession({ ...session, ...user });
      setState({
        isLoading: false,
        isAuthenticated: true,
        accessToken: session.accessToken,
        user,
      });
    } catch (error) {
      await AuthStorage.clear();
      setState({
        isLoading: false,
        isAuthenticated: false,
        accessToken: null,
        user: null,
      });
    }
  }, []);

  const setUser = useCallback((user: AuthUser | null) => {
    if (user) void AuthStorage.saveUser(user);
    setState((current) => ({
      ...current,
      user,
      isAuthenticated: Boolean(user),
    }));
  }, []);

  const refreshProfessionalStatus = useCallback(async () => {
    const session = await AuthStorage.getSession();
    if (!session || session.role !== 'PROFESSIONAL') return null;
    const profile = await getProfessionalProfile(session.accountId);
    const user: AuthUser = { ...session, ...profile, role: 'PROFESSIONAL', profileId: profile.professionalId };
    await AuthStorage.saveSession({ ...session, ...user });
    setState((current) => ({ ...current, user, isAuthenticated: true }));
    return user;
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      logout({ redirect: true });
    });
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      restoreSession,
      setUser,
      refreshProfessionalStatus,
    }),
    [state, login, logout, restoreSession, setUser, refreshProfessionalStatus]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
