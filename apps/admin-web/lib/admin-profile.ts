import { authFetch } from '@ams/web-auth';
import type { AdminAccount, AuthProfile, CreateAdminInput, UpdateAdminProfileInput } from '@ams/shared-types';
import { getApiUrl } from './api';

export async function updateAdminProfile(
  token: string,
  data: UpdateAdminProfileInput,
): Promise<AuthProfile> {
  const res = await authFetch(getApiUrl(), '/api/admin/profile', token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'プロフィールの更新に失敗しました');
  }
  return res.json();
}

export async function fetchAdmins(token: string): Promise<AdminAccount[]> {
  const res = await authFetch(getApiUrl(), '/api/admin/admins', token);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '管理者一覧の取得に失敗しました');
  }
  return res.json();
}

export async function createAdmin(token: string, data: CreateAdminInput): Promise<AdminAccount> {
  const res = await authFetch(getApiUrl(), '/api/admin/admins', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '管理者の追加に失敗しました');
  }
  return res.json();
}
