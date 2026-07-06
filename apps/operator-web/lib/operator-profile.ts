import { authFetch } from '@ams/web-auth';
import type { AuthProfile, UpdateOperatorProfileInput } from '@ams/shared-types';
import { getApiUrl } from './api';

export async function updateOperatorProfile(
  token: string,
  data: UpdateOperatorProfileInput,
): Promise<AuthProfile> {
  const res = await authFetch(getApiUrl(), '/api/operator/profile', token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'プロフィールの更新に失敗しました');
  }
  return res.json();
}
