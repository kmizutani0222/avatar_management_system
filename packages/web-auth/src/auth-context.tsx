'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthProfile, UserRole } from '@ams/shared-types';
import {
  clearStoredToken,
  fetchProfile,
  getStoredToken,
  login as apiLogin,
  register as apiRegister,
  setStoredToken,
  type LoginParams,
  type RegisterParams,
} from './auth-api';

interface AuthContextValue {
  profile: AuthProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (params: Omit<LoginParams, 'role'>) => Promise<void>;
  register: (params: Omit<RegisterParams, 'role'>) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  apiUrl: string;
  role: UserRole;
}

export function AuthProvider({ children, apiUrl, role }: AuthProviderProps) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const stored = getStoredToken();
    if (!stored) {
      setProfile(null);
      setToken(null);
      return;
    }
    const me = await fetchProfile(apiUrl, stored);
    if (me.role !== role) {
      clearStoredToken();
      setProfile(null);
      setToken(null);
      throw new Error('Invalid role for this application');
    }
    setToken(stored);
    setProfile(me);
  }, [apiUrl, role]);

  useEffect(() => {
    refreshProfile()
      .catch(() => {
        clearStoredToken();
        setProfile(null);
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [refreshProfile]);

  const login = useCallback(
    async (params: Omit<LoginParams, 'role'>) => {
      const result = await apiLogin(apiUrl, { ...params, role });
      setStoredToken(result.accessToken);
      setToken(result.accessToken);
      const me = await fetchProfile(apiUrl, result.accessToken);
      setProfile(me);
    },
    [apiUrl, role],
  );

  const register = useCallback(
    async (params: Omit<RegisterParams, 'role'>) => {
      if (role === 'admin') throw new Error('Registration not available');
      const result = await apiRegister(apiUrl, { ...params, role });
      setStoredToken(result.accessToken);
      setToken(result.accessToken);
      const me = await fetchProfile(apiUrl, result.accessToken);
      setProfile(me);
    },
    [apiUrl, role],
  );

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ profile, token, isLoading, login, register, logout, refreshProfile }),
    [profile, token, isLoading, login, register, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
