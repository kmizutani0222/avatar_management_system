export const SANDBOX_OAUTH_CODE_KEY = 'ams_sandbox_oauth_code';
export const SANDBOX_OAUTH_CLIENT_ID_KEY = 'ams_sandbox_oauth_client_id';
export const SANDBOX_OAUTH_ERROR_KEY = 'ams_sandbox_oauth_error';
export const SANDBOX_OAUTH_RETURN_PATH = '/sandbox';

export function getUserWebUrl() {
  return process.env.NEXT_PUBLIC_USER_WEB_URL ?? 'http://localhost:4001';
}

export function getDefaultOAuthRedirectUri() {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/oauth/callback`;
  }
  return process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI ?? 'http://localhost:4002/oauth/callback';
}

export function buildOAuthAuthorizeUrl(params: {
  clientId: string;
  redirectUri?: string;
  state?: string;
}) {
  const userWeb = getUserWebUrl().replace(/\/$/, '');
  const redirectUri = params.redirectUri ?? getDefaultOAuthRedirectUri();
  const search = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
  });
  if (params.state) search.set('state', params.state);
  return `${userWeb}/oauth/authorize?${search}`;
}
