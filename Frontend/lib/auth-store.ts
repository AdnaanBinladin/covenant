'use client';

import { create } from 'zustand';
import { getSessionRequest, loginRequest, logoutRequest } from './auth-client';
import { AuthSession, AuthUser } from './auth-types';

const AUTH_STORAGE_KEY = 'covenant-auth';

function writeSessionToStorage(session: AuthSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function readSessionFromStorage(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function clearSessionFromStorage() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

interface AuthState {
  token: string | null;
  expiresAt: number | null;
  user: AuthUser | null;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  login: (email: string, password: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: null,
  expiresAt: null,
  user: null,
  isReady: false,
  isLoading: false,
  error: null,

  setSession: (session) => {
    writeSessionToStorage(session);
    set({
      token: session.token,
      expiresAt: session.expiresAt,
      user: session.user,
      isReady: true,
      isLoading: false,
      error: null,
    });
  },

  clearSession: () => {
    clearSessionFromStorage();
    set({
      token: null,
      expiresAt: null,
      user: null,
      isReady: true,
      isLoading: false,
      error: null,
    });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const session = await loginRequest(email, password);
      get().setSession(session);
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed.',
      });
      throw error;
    }
  },

  restoreSession: async () => {
    const storedSession = readSessionFromStorage();

    if (!storedSession?.token || !storedSession.expiresAt) {
      set({ isReady: true, isLoading: false });
      return;
    }

    if (Date.now() >= storedSession.expiresAt) {
      get().clearSession();
      return;
    }

    set({
      token: storedSession.token,
      expiresAt: storedSession.expiresAt,
      user: storedSession.user,
      isLoading: true,
      error: null,
    });

    try {
      const session = await getSessionRequest(storedSession.token);
      get().setSession(session);
    } catch {
      get().clearSession();
    }
  },

  logout: async () => {
    const { token } = get();
    set({ isLoading: true, error: null });

    try {
      if (token) {
        await logoutRequest(token);
      }
    } finally {
      get().clearSession();
    }
  },
}));
