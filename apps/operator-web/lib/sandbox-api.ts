import { getApiUrl } from './api';

export interface SandboxRequestResult {
  ok: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  contentType: string;
  bodyText: string;
}

function buildUrl(base: string, path: string) {
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

async function readJsonResponse(res: Response): Promise<Pick<SandboxRequestResult, 'bodyText'>> {
  const text = await res.text();
  try {
    return { bodyText: JSON.stringify(JSON.parse(text), null, 2) };
  } catch {
    return { bodyText: text };
  }
}

/** 開発用: OAuth token 交換（本番は外部サイトのバックエンドで実施） */
export async function sandboxOAuthTokenRequest(params: {
  apiBase?: string;
  grantType: string;
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
}): Promise<SandboxRequestResult & { accessToken?: string }> {
  const base = params.apiBase?.trim() || getApiUrl();
  const url = buildUrl(base, '/api/v1/oauth/token');
  const start = performance.now();
  const body: Record<string, string> = {
    grant_type: params.grantType,
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  };
  if (params.redirectUri) body.redirect_uri = params.redirectUri;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const parsed = await readJsonResponse(res);
  let accessToken: string | undefined;
  if (res.ok) {
    try {
      accessToken = (JSON.parse(parsed.bodyText) as { access_token?: string }).access_token;
    } catch {
      /* ignore */
    }
  }
  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    durationMs: Math.round(performance.now() - start),
    contentType: res.headers.get('content-type') ?? '',
    ...parsed,
    accessToken,
  };
}

/** 開発用: OAuth 認可コード取得 */
export async function sandboxOAuthAuthorizeRequest(params: {
  apiBase?: string;
  userJwt: string;
  clientId: string;
  redirectUri?: string;
}): Promise<SandboxRequestResult & { code?: string }> {
  const base = params.apiBase?.trim() || getApiUrl();
  const url = buildUrl(base, '/api/v1/oauth/authorize');
  const start = performance.now();
  const body: Record<string, string> = { clientId: params.clientId };
  if (params.redirectUri) body.redirectUri = params.redirectUri;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.userJwt}`,
    },
    body: JSON.stringify(body),
  });
  const parsed = await readJsonResponse(res);
  let code: string | undefined;
  if (res.ok) {
    try {
      code = (JSON.parse(parsed.bodyText) as { code?: string }).code;
    } catch {
      /* ignore */
    }
  }
  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    durationMs: Math.round(performance.now() - start),
    contentType: res.headers.get('content-type') ?? '',
    ...parsed,
    code,
  };
}

export interface SandboxUserLoginResult {
  accessToken: string;
  userId: string;
  email: string;
  displayName?: string;
}

/** 開発用: テストユーザーの JWT を取得（OAuth Step 1 用） */
export async function sandboxUserLogin(params: {
  apiBase?: string;
  email: string;
  password: string;
}): Promise<SandboxUserLoginResult> {
  const base = params.apiBase?.trim() || getApiUrl();
  const loginUrl = buildUrl(base, '/api/auth/login');
  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      role: 'user',
    }),
  });
  const parsed = await readJsonResponse(res);
  if (!res.ok) {
    throw new Error(parsed.bodyText || `Login failed (${res.status})`);
  }

  const { accessToken } = JSON.parse(parsed.bodyText) as { accessToken: string };
  const meRes = await fetch(buildUrl(base, '/api/auth/me'), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meParsed = await readJsonResponse(meRes);
  if (!meRes.ok) {
    throw new Error(meParsed.bodyText || `Profile fetch failed (${meRes.status})`);
  }

  const profile = JSON.parse(meParsed.bodyText) as {
    id: string;
    email: string;
    displayName?: string;
  };

  return {
    accessToken,
    userId: profile.id,
    email: profile.email,
    displayName: profile.displayName,
  };
}
