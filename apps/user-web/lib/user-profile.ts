import { authFetch } from '@ams/web-auth';
import type { AuthProfile, UpdateUserProfileInput } from '@ams/shared-types';
import { getApiUrl } from './api';

export function getProfileIconUrl() {
  return `${getApiUrl()}/api/user/profile/icon`;
}

export async function updateUserProfile(
  token: string,
  data: UpdateUserProfileInput,
): Promise<AuthProfile> {
  const res = await authFetch(getApiUrl(), '/api/user/profile', token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'プロフィールの更新に失敗しました');
  }
  return res.json();
}

export async function uploadProfileIcon(token: string, file: File): Promise<AuthProfile> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${getApiUrl()}/api/user/profile/icon`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'アイコンのアップロードに失敗しました');
  }
  return res.json();
}
