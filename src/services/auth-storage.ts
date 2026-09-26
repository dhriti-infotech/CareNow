import * as SecureStore from 'expo-secure-store';

import type { AuthSession, AuthUser, PendingRegistration } from '@/types/auth';

const SESSION_KEY = 'careNowAuthSession';
const PENDING_REGISTRATION_KEY = 'careNowPendingRegistration';

export const AuthStorage = {
  async saveSession(session: AuthSession): Promise<void> { await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session)); },
  async getSession(): Promise<AuthSession | null> {
    const value = await SecureStore.getItemAsync(SESSION_KEY);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AuthSession;
    } catch {
      return null;
    }
  },

  async getToken(): Promise<string | null> { return (await this.getSession())?.accessToken ?? null; },
  async getUser(): Promise<AuthUser | null> { const session = await this.getSession(); if (!session) return null; const { accessToken: _token, tokenType: _type, ...user } = session; return user; },
  async saveToken(token: string): Promise<void> { const session = await this.getSession(); if (session) await this.saveSession({ ...session, accessToken: token }); },
  async saveUser(user: AuthUser): Promise<void> { const session = await this.getSession(); if (session) await this.saveSession({ ...session, ...user }); },
  async removeToken(): Promise<void> { await this.clear(); },
  async removeUser(): Promise<void> { await this.clear(); },
  async savePendingRegistration(value: PendingRegistration) { await SecureStore.setItemAsync(PENDING_REGISTRATION_KEY, JSON.stringify(value)); },
  async getPendingRegistration(): Promise<PendingRegistration | null> { const value = await SecureStore.getItemAsync(PENDING_REGISTRATION_KEY); try { return value ? JSON.parse(value) as PendingRegistration : null; } catch { return null; } },
  async clearPendingRegistration() { await SecureStore.deleteItemAsync(PENDING_REGISTRATION_KEY); },
  async clear(): Promise<void> { await SecureStore.deleteItemAsync(SESSION_KEY); await this.clearPendingRegistration(); },
};
