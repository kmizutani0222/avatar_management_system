import { authFetch } from '@ams/web-auth';
import { AvatarBodyType, type ExpressionMorphSettings } from '@ams/shared-types';
import { getApiUrl } from './api';

export type { ExpressionMorphSettings };

async function adminFetch<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await authFetch(getApiUrl(), path, token, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Request failed: ${path}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  _count: { avatars: number };
}

export interface AdminOperator {
  id: string;
  email: string;
  companyName: string;
  status: string;
  createdAt: string;
  _count: { apiKeys: number; oauthClients: number };
}

export interface AdminPart {
  id: string;
  bodyType: AvatarBodyType;
  category: string;
  name: string;
  metadata: unknown;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminAvatar {
  id: string;
  name: string;
  bodyType: AvatarBodyType;
  sourceType: string;
  status: string;
  externalEnabled: boolean;
  adminApproved: boolean;
  isAdminCreated: boolean;
  user: { id: string; email: string; displayName: string };
}

export function fetchAdminUsers(token: string) {
  return adminFetch<AdminUser[]>(token, '/api/admin/users');
}

export function updateAdminUser(
  token: string,
  id: string,
  data: { displayName?: string; isActive?: boolean },
) {
  return adminFetch<AdminUser>(token, `/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function fetchAdminOperators(token: string) {
  return adminFetch<AdminOperator[]>(token, '/api/admin/operators');
}

export function updateAdminOperator(
  token: string,
  id: string,
  status: 'pending' | 'active' | 'suspended',
) {
  return adminFetch<AdminOperator>(token, `/api/admin/operators/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function fetchAdminParts(token: string, bodyType?: AvatarBodyType) {
  const q = bodyType ? `?bodyType=${bodyType}` : '';
  return adminFetch<AdminPart[]>(token, `/api/admin/parts${q}`);
}

export function createAdminPart(
  token: string,
  data: {
    bodyType: AvatarBodyType;
    category: string;
    name: string;
    sortOrder?: number;
    metadata?: object;
  },
) {
  return adminFetch<AdminPart>(token, '/api/admin/parts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateAdminPart(
  token: string,
  id: string,
  data: { name?: string; isActive?: boolean; sortOrder?: number; metadata?: object },
) {
  return adminFetch<AdminPart>(token, `/api/admin/parts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteAdminPart(token: string, id: string) {
  return adminFetch<{ deleted: boolean }>(token, `/api/admin/parts/${id}`, {
    method: 'DELETE',
  });
}

export function uploadAdminPartAsset(token: string, id: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return fetch(`${getApiUrl()}/api/admin/parts/${id}/asset`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? 'GLB アップロードに失敗しました');
    }
    return res.json() as Promise<AdminPart>;
  });
}

export function fetchAdminAvatars(token: string) {
  return adminFetch<AdminAvatar[]>(token, '/api/admin/avatars');
}

export function publishAdminAvatar(token: string, id: string) {
  return adminFetch<AdminAvatar>(token, `/api/admin/avatars/${id}/publish`, {
    method: 'POST',
  });
}

export function unpublishAdminAvatar(token: string, id: string) {
  return adminFetch<AdminAvatar>(token, `/api/admin/avatars/${id}/unpublish`, {
    method: 'POST',
  });
}

export function deleteAdminAvatar(token: string, id: string) {
  return adminFetch<{ deleted: boolean }>(token, `/api/admin/avatars/${id}`, {
    method: 'DELETE',
  });
}

export interface TemplateStatus {
  bodyType: string;
  key: string;
  hasTemplate: boolean;
  isCustomUpload: boolean;
}

export function fetchTemplateStatus(token: string) {
  return adminFetch<TemplateStatus[]>(token, '/api/admin/templates');
}

export function uploadBaseTemplate(token: string, bodyType: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return fetch(`${getApiUrl()}/api/admin/templates/${bodyType}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? 'テンプレートのアップロードに失敗しました');
    }
    return res.json() as Promise<TemplateStatus & { regenerated?: boolean }>;
  });
}

export function resetBaseTemplate(token: string, bodyType: string) {
  return adminFetch<TemplateStatus & { regenerated?: boolean }>(
    token,
    `/api/admin/templates/${bodyType}`,
    { method: 'DELETE' },
  );
}

export function fetchExpressionSettings(token: string) {
  return adminFetch<ExpressionMorphSettings>(token, '/api/admin/settings/expressions');
}

export function updateExpressionSettings(
  token: string,
  data: Partial<ExpressionMorphSettings>,
) {
  return adminFetch<ExpressionMorphSettings>(token, '/api/admin/settings/expressions', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
