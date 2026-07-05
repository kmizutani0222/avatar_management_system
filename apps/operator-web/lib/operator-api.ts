import { authFetch } from '@ams/web-auth';
import type { ApiKeyCreated, ApiKeySummary, OAuthClientCreated, OAuthClientSummary } from '@ams/shared-types';
import { getApiUrl } from './api';

async function operatorFetch<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await authFetch(getApiUrl(), path, token, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Request failed: ${path}`);
  }
  return res.json();
}

export function fetchApiKeys(token: string) {
  return operatorFetch<ApiKeySummary[]>(token, '/api/operator/api-keys');
}

export function createApiKey(token: string, name: string) {
  return operatorFetch<ApiKeyCreated>(token, '/api/operator/api-keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function revokeApiKey(token: string, id: string) {
  return operatorFetch<{ revoked: boolean }>(token, `/api/operator/api-keys/${id}`, {
    method: 'DELETE',
  });
}

export function fetchOAuthClients(token: string) {
  return operatorFetch<OAuthClientSummary[]>(token, '/api/operator/oauth-clients');
}

export function createOAuthClient(token: string, name: string, redirectUris?: string[]) {
  return operatorFetch<OAuthClientCreated>(token, '/api/operator/oauth-clients', {
    method: 'POST',
    body: JSON.stringify({ name, redirectUris }),
  });
}

export function deactivateOAuthClient(token: string, id: string) {
  return operatorFetch<OAuthClientSummary>(token, `/api/operator/oauth-clients/${id}/deactivate`, {
    method: 'PATCH',
  });
}
