import { router } from 'expo-router';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { getCurrentUser } from '../api/authApi';
import { setSessionExpiredHandler } from '../api/client';
import { logout as clearLegacySession } from '../services/auth';
import { AuthStorage } from '../services/auth-storage';
import type { AuthResponse, AuthState, AuthUser } from '../types/auth';

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
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  const logout = useCallback(async (options?: { redirect?: boolean }) => {
    await clearLegacySession();
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
    const normalizedUser: AuthUser = {
      ...authResponse.user,
      role: authResponse.user.role || 'USER',
      professionalType: authResponse.user.professionalType,
    };

    await clearLegacySession();
    await AuthStorage.saveToken(authResponse.accessToken);
    await AuthStorage.saveUser(normalizedUser);

    setState({
      isLoading: false,
      isAuthenticated: true,
      accessToken: authResponse.accessToken,
      user: normalizedUser,
    });
  }, []);

  const restoreSession = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true }));

    const token = await AuthStorage.getToken();
    if (!token) {
      setState({
        isLoading: false,
        isAuthenticated: false,
        accessToken: null,
        user: null,
      });
      return;
    }

    try {
      const user = await getCurrentUser();
      setState({
        isLoading: false,
        isAuthenticated: true,
        accessToken: token,
        user,
      });
      await AuthStorage.saveUser(user);
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
    setState((current) => ({
      ...current,
      user,
      isAuthenticated: Boolean(user),
    }));
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
    }),
    [state, login, logout, restoreSession, setUser]
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
