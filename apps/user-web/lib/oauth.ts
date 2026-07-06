import type { OAuthAuthorizeResponse, OAuthPublicClientInfo } from '@ams/shared-types';
import { getApiUrl } from './api';

export async function fetchOAuthClientInfo(
  clientId: string,
  redirectUri: string,
): Promise<OAuthPublicClientInfo> {
  const params = new URLSearchParams({ redirect_uri: redirectUri });
  const res = await fetch(
    `${getApiUrl()}/api/v1/oauth/clients/${encodeURIComponent(clientId)}?${params}`,
    { cache: 'no-store' },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'OAuth client not found');
  }
  return res.json();
}

export async function authorizeOAuth(
  token: string,
  clientId: string,
  redirectUri: string,
): Promise<OAuthAuthorizeResponse> {
  const res = await fetch(`${getApiUrl()}/api/v1/oauth/authorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ clientId, redirectUri }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Authorization failed');
  }
  return res.json();
}
