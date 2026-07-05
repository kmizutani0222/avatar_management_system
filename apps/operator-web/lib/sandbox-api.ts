import { getApiUrl } from './api';

export interface SandboxRequestResult {
  ok: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  contentType: string;
  bodyText: string;
  isBinary: boolean;
  blobUrl?: string;
}

function buildUrl(base: string, path: string) {
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

async function readResponse(res: Response): Promise<Pick<SandboxRequestResult, 'bodyText' | 'isBinary' | 'blobUrl'>> {
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json') || contentType.includes('text/')) {
    const text = await res.text();
    try {
      return { bodyText: JSON.stringify(JSON.parse(text), null, 2), isBinary: false };
    } catch {
      return { bodyText: text, isBinary: false };
    }
  }
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  return {
    bodyText: `[Binary] ${blob.size.toLocaleString()} bytes · ${contentType || 'unknown'}`,
    isBinary: true,
    blobUrl,
  };
}

export async function sandboxApiKeyRequest(params: {
  apiBase?: string;
  apiKey: string;
  userId: string;
  path: string;
}): Promise<SandboxRequestResult> {
  const base = params.apiBase?.trim() || getApiUrl();
  const url = buildUrl(base, params.path);
  const start = performance.now();
  const res = await fetch(url, {
    headers: {
      'X-API-Key': params.apiKey,
      'X-User-Id': params.userId,
    },
  });
  const parsed = await readResponse(res);
  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    durationMs: Math.round(performance.now() - start),
    contentType: res.headers.get('content-type') ?? '',
    ...parsed,
  };
}

export async function sandboxOAuthTokenRequest(params: {
  apiBase?: string;
  grantType: string;
  code: string;
  clientId: string;
  clientSecret: string;
}): Promise<SandboxRequestResult> {
  const base = params.apiBase?.trim() || getApiUrl();
  const url = buildUrl(base, '/api/v1/oauth/token');
  const start = performance.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: params.grantType,
      code: params.code,
      client_id: params.clientId,
      client_secret: params.clientSecret,
    }),
  });
  const parsed = await readResponse(res);
  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    durationMs: Math.round(performance.now() - start),
    contentType: res.headers.get('content-type') ?? '',
    ...parsed,
  };
}

export async function sandboxOAuthAuthorizeRequest(params: {
  apiBase?: string;
  userJwt: string;
  clientId: string;
}): Promise<SandboxRequestResult> {
  const base = params.apiBase?.trim() || getApiUrl();
  const url = buildUrl(base, '/api/v1/oauth/authorize');
  const start = performance.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.userJwt}`,
    },
    body: JSON.stringify({ clientId: params.clientId }),
  });
  const parsed = await readResponse(res);
  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    durationMs: Math.round(performance.now() - start),
    contentType: res.headers.get('content-type') ?? '',
    ...parsed,
  };
}

export interface SandboxUserLoginResult {
  accessToken: string;
  userId: string;
  email: string;
  displayName?: string;
  loginResponse: SandboxRequestResult;
}

/** 開発用: ユーザー email/password から JWT を取得 */
export async function sandboxUserLogin(params: {
  apiBase?: string;
  email: string;
  password: string;
}): Promise<SandboxUserLoginResult> {
  const base = params.apiBase?.trim() || getApiUrl();
  const loginUrl = buildUrl(base, '/api/auth/login');
  const start = performance.now();
  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      role: 'user',
    }),
  });
  const parsed = await readResponse(res);
  const loginResponse: SandboxRequestResult = {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    durationMs: Math.round(performance.now() - start),
    contentType: res.headers.get('content-type') ?? '',
    ...parsed,
  };

  if (!res.ok) {
    throw new Error(parsed.bodyText || `Login failed (${res.status})`);
  }

  let accessToken: string;
  try {
    accessToken = (JSON.parse(parsed.bodyText) as { accessToken: string }).accessToken;
  } catch {
    throw new Error('Login response did not include accessToken');
  }

  const meStart = performance.now();
  const meRes = await fetch(buildUrl(base, '/api/auth/me'), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meParsed = await readResponse(meRes);
  if (!meRes.ok) {
    throw new Error(meParsed.bodyText || `Profile fetch failed (${meRes.status})`);
  }

  const profile = JSON.parse(meParsed.bodyText) as {
    id: string;
    email: string;
    displayName?: string;
  };

  loginResponse.bodyText = [
    '--- POST /api/auth/login ---',
    parsed.bodyText,
    '',
    `--- GET /api/auth/me (${Math.round(performance.now() - meStart)}ms) ---`,
    meParsed.bodyText,
  ].join('\n');

  return {
    accessToken,
    userId: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    loginResponse,
  };
}

export async function sandboxBearerRequest(params: {
  apiBase?: string;
  accessToken: string;
  path: string;
}): Promise<SandboxRequestResult> {
  const base = params.apiBase?.trim() || getApiUrl();
  const url = buildUrl(base, params.path);
  const start = performance.now();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${params.accessToken}` },
  });
  const parsed = await readResponse(res);
  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    durationMs: Math.round(performance.now() - start),
    contentType: res.headers.get('content-type') ?? '',
    ...parsed,
  };
}
