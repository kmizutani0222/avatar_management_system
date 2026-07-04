import type { AuthLoginResponse, AuthProfile, UserRole } from '@ams/shared-types';

const TOKEN_KEY = 'ams_access_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface LoginParams {
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterParams {
  email: string;
  password: string;
  role: 'user' | 'operator';
  displayName?: string;
  companyName?: string;
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (Array.isArray(body.message)) return body.message.join(', ');
    if (typeof body.message === 'string') return body.message;
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`;
}

export async function login(apiUrl: string, params: LoginParams): Promise<AuthLoginResponse> {
  const res = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function register(apiUrl: string, params: RegisterParams): Promise<AuthLoginResponse> {
  const res = await fetch(`${apiUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchProfile(apiUrl: string, token: string): Promise<AuthProfile> {
  const res = await fetch(`${apiUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function authFetch(apiUrl: string, path: string, token: string, init?: RequestInit) {
  return fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
}
