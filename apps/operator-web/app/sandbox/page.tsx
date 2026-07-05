'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { RequireAuth, useAuth } from '@ams/web-auth';
import { getApiUrl } from '@/lib/api';
import {
  sandboxApiKeyRequest,
  sandboxBearerRequest,
  sandboxOAuthAuthorizeRequest,
  sandboxOAuthTokenRequest,
  sandboxUserLogin,
  type SandboxRequestResult,
} from '@/lib/sandbox-api';

type AuthMode = 'api-key' | 'oauth';
type AvatarEndpoint = 'list' | 'detail' | 'model';

function avatarPath(endpoint: AvatarEndpoint, avatarId: string) {
  if (endpoint === 'list') return '/api/v1/avatars';
  if (endpoint === 'detail') return `/api/v1/avatars/${avatarId || ':avatarId'}`;
  return `/api/v1/avatars/${avatarId || ':avatarId'}/model`;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="code-block-wrap">
      <button type="button" className="code-copy-btn" onClick={copy}>
        {copied ? 'コピー済' : 'コピー'}
      </button>
      <pre className="code-block">{code}</pre>
    </div>
  );
}

function ResponsePanel({ result, onClear }: { result: SandboxRequestResult | null; onClear: () => void }) {
  useEffect(() => {
    return () => {
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    };
  }, [result]);

  if (!result) return null;

  return (
    <div className={`response-panel ${result.ok ? 'response-ok' : 'response-error'}`}>
      <div className="response-header">
        <span>
          {result.status} {result.statusText} · {result.durationMs}ms
        </span>
        <button type="button" className="btn-secondary btn-sm" onClick={onClear}>
          クリア
        </button>
      </div>
      <pre className="response-body">{result.bodyText}</pre>
      {result.blobUrl && (
        <a href={result.blobUrl} download="avatar-model" className="btn-secondary btn-sm">
          ファイルをダウンロード
        </a>
      )}
    </div>
  );
}

function SandboxContent() {
  const { profile } = useAuth();
  const defaultBase = getApiUrl();

  const [authMode, setAuthMode] = useState<AuthMode>('api-key');
  const [apiBase, setApiBase] = useState(defaultBase);
  const [userId, setUserId] = useState('');
  const [avatarId, setAvatarId] = useState('');
  const [endpoint, setEndpoint] = useState<AvatarEndpoint>('list');

  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [userPassword, setUserPassword] = useState('');
  const [userJwt, setUserJwt] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [jwtFetched, setJwtFetched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SandboxRequestResult | null>(null);

  const path = avatarPath(endpoint, avatarId);

  const apiKeyCurl = useMemo(
    () => `curl -s "${apiBase}${path}" \\
  -H "X-API-Key: ${apiKey || 'ams_YOUR_API_KEY'}" \\
  -H "X-User-Id: ${userId || 'USER_UUID'}"`,
    [apiBase, path, apiKey, userId],
  );

  const apiKeyFetch = useMemo(
    () => `const res = await fetch("${apiBase}${path}", {
  headers: {
    "X-API-Key": process.env.AMS_API_KEY,
    "X-User-Id": "${userId || 'USER_UUID'}",
  },
});
const data = await res.json();`,
    [apiBase, path, userId],
  );

  const userLoginCurl = useMemo(
    () => `curl -s -X POST "${apiBase}/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "${userEmail || 'user@example.com'}",
    "password": "YOUR_PASSWORD",
    "role": "user"
  }'`,
    [apiBase, userEmail],
  );

  const oauthAuthorizeCurl = useMemo(
    () => `curl -s -X POST "${apiBase}/api/v1/oauth/authorize" \\
  -H "Authorization: Bearer ${userJwt || 'USER_JWT'}" \\
  -H "Content-Type: application/json" \\
  -d '{"clientId":"${clientId || 'cli_xxx'}"}'`,
    [apiBase, clientId, userJwt],
  );

  const oauthTokenCurl = useMemo(
    () => `curl -s -X POST "${apiBase}/api/v1/oauth/token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "code": "${authCode || 'AUTH_CODE'}",
    "client_id": "${clientId || 'cli_xxx'}",
    "client_secret": "${clientSecret || 'sec_xxx'}"
  }'`,
    [apiBase, authCode, clientId, clientSecret],
  );

  const oauthFetchCurl = useMemo(
    () => `curl -s "${apiBase}${path}" \\
  -H "Authorization: Bearer ${accessToken || 'ACCESS_TOKEN'}"`,
    [apiBase, path, accessToken],
  );

  const oauthFetchJs = useMemo(
    () => `const res = await fetch("${apiBase}${path}", {
  headers: {
    Authorization: \`Bearer \${accessToken}\`,
  },
});
const data = await res.json();`,
    [apiBase, path],
  );

  function clearResult() {
    setResult((prev) => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
    setError('');
  }

  async function runApiKeyRequest() {
    if (!apiKey.trim() || !userId.trim()) {
      setError('API キーとユーザー ID を入力してください');
      return;
    }
    if (endpoint !== 'list' && !avatarId.trim()) {
      setError('アバター ID を入力してください');
      return;
    }
    setLoading(true);
    setError('');
    clearResult();
    try {
      const res = await sandboxApiKeyRequest({
        apiBase,
        apiKey: apiKey.trim(),
        userId: userId.trim(),
        path,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'リクエストに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function runUserLogin() {
    if (!userEmail.trim() || !userPassword) {
      setError('ユーザーの email / password を入力してください');
      return;
    }
    setLoading(true);
    setError('');
    clearResult();
    try {
      const login = await sandboxUserLogin({
        apiBase,
        email: userEmail.trim(),
        password: userPassword,
      });
      setUserJwt(login.accessToken);
      setUserId(login.userId);
      setJwtFetched(true);
      setResult(login.loginResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JWT 取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function runOAuthAuthorize() {
    if (!userJwt.trim() || !clientId.trim()) {
      setError('ユーザー JWT と client_id を入力してください');
      return;
    }
    setLoading(true);
    setError('');
    clearResult();
    try {
      const res = await sandboxOAuthAuthorizeRequest({
        apiBase,
        userJwt: userJwt.trim(),
        clientId: clientId.trim(),
      });
      setResult(res);
      if (res.ok) {
        try {
          const parsed = JSON.parse(res.bodyText) as { code?: string };
          if (parsed.code) setAuthCode(parsed.code);
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'リクエストに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function runOAuthToken() {
    if (!authCode.trim() || !clientId.trim() || !clientSecret.trim()) {
      setError('code / client_id / client_secret を入力してください');
      return;
    }
    setLoading(true);
    setError('');
    clearResult();
    try {
      const res = await sandboxOAuthTokenRequest({
        apiBase,
        grantType: 'authorization_code',
        code: authCode.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
      });
      setResult(res);
      if (res.ok) {
        try {
          const parsed = JSON.parse(res.bodyText) as { access_token?: string };
          if (parsed.access_token) setAccessToken(parsed.access_token);
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'リクエストに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function runBearerRequest() {
    if (!accessToken.trim()) {
      setError('access_token を入力してください');
      return;
    }
    if (endpoint !== 'list' && !avatarId.trim()) {
      setError('アバター ID を入力してください');
      return;
    }
    setLoading(true);
    setError('');
    clearResult();
    try {
      const res = await sandboxBearerRequest({
        apiBase,
        accessToken: accessToken.trim(),
        path,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'リクエストに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  const isActive = profile?.status === 'active';

  return (
    <main className="sandbox-main">
      <header className="page-header">
        <div>
          <span className="badge badge-operator">Operator :4002</span>
          <h1>連携サンドボックス</h1>
          <p className="subtitle">外部サイト実装用のサンプルフォーム・コード例・リクエスト試行</p>
        </div>
        <Link href="/dashboard" className="btn-secondary">
          ダッシュボード
        </Link>
      </header>

      {!isActive && (
        <p className="form-error">
          運営者アカウントが承認されていません。API キー / OAuth クライアントは管理者承認後に利用できます。
        </p>
      )}

      <div className="card">
        <h2>共通設定</h2>
        <div className="form-grid">
          <label className="field-label">
            API ベース URL
            <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} placeholder="http://localhost:4003" />
          </label>
          <label className="field-label">
            ユーザー ID（AMS）
            <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="550e8400-..." />
          </label>
          <label className="field-label">
            アバター ID（詳細・モデル取得時）
            <input value={avatarId} onChange={(e) => setAvatarId(e.target.value)} placeholder="uuid" />
          </label>
          <label className="field-label">
            エンドポイント
            <select value={endpoint} onChange={(e) => setEndpoint(e.target.value as AvatarEndpoint)}>
              <option value="list">GET /api/v1/avatars（一覧）</option>
              <option value="detail">GET /api/v1/avatars/:id（詳細）</option>
              <option value="model">GET /api/v1/avatars/:id/model（VRM）</option>
            </select>
          </label>
        </div>
        <p className="hint">
          ユーザー ID はユーザーダッシュボード（:4001）のアカウント欄から取得できます。
          アバター ID は外部連携 ON のアバターカードに表示されます。
          外部連携では <strong>VRM/GLB ファイルのみ</strong> を取得します（パーツ API は不要）。
        </p>
      </div>

      <div className="sandbox-tabs">
        <button
          type="button"
          className={`sandbox-tab ${authMode === 'api-key' ? 'active' : ''}`}
          onClick={() => { setAuthMode('api-key'); clearResult(); }}
        >
          API キー方式
        </button>
        <button
          type="button"
          className={`sandbox-tab ${authMode === 'oauth' ? 'active' : ''}`}
          onClick={() => { setAuthMode('oauth'); clearResult(); }}
        >
          OAuth 方式
        </button>
      </div>

      {authMode === 'api-key' && (
        <>
          <div className="card">
            <h2>API キー方式 — 入力</h2>
            <div className="form-grid">
              <label className="field-label">
                X-API-Key
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="ams_..."
                  autoComplete="off"
                />
              </label>
            </div>
            <p className="hint">
              <Link href="/api-keys">API キー管理</Link> で発行したキーを入力してください（サーバー側で保持する想定）。
            </p>
            <button type="button" className="btn-primary" disabled={loading} onClick={runApiKeyRequest}>
              {loading ? '送信中...' : 'リクエストを送信'}
            </button>
          </div>

          <div className="card">
            <h2>実装例 — cURL</h2>
            <CodeBlock code={apiKeyCurl} />
            <h2 className="section-subtitle">実装例 — JavaScript (fetch)</h2>
            <CodeBlock code={apiKeyFetch} />
          </div>
        </>
      )}

      {authMode === 'oauth' && (
        <>
          <div className="card sandbox-dev-card">
            <h2>開発用 — ユーザー JWT 取得</h2>
            <p className="hint">
              テスト用ユーザー（例: user@example.com / user123456）の email / password で
              accessToken を取得し、下の Step 1 フォームへ自動入力します。
            </p>
            <div className="form-grid">
              <label className="field-label">
                ユーザー email
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  autoComplete="username"
                />
              </label>
              <label className="field-label">
                パスワード
                <input
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="user123456"
                  autoComplete="current-password"
                />
              </label>
            </div>
            <button type="button" className="btn-primary" disabled={loading} onClick={runUserLogin}>
              {loading ? '取得中...' : 'JWT を取得して入力'}
            </button>
            {jwtFetched && userJwt && (
              <p className="hint jwt-success">
                JWT とユーザー ID を入力済みです。続けて Step 1 の認可コード取得を実行できます。
              </p>
            )}
            <h3 className="section-subtitle">cURL 例</h3>
            <CodeBlock code={userLoginCurl} />
          </div>

          <div className="card">
            <h2>Step 1 — 認可コード取得（ユーザー JWT が必要）</h2>
            <p className="hint">
              上の補助フォームで JWT を取得するか、手動で入力してください。
              本番では外部サイトのログイン画面からユーザーを AMS 認証に誘導します。
            </p>
            <div className="form-grid">
              <label className="field-label">
                client_id
                <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="cli_..." />
              </label>
              <label className="field-label field-label-wide">
                ユーザー JWT（Bearer）
                <input
                  type="password"
                  value={userJwt}
                  onChange={(e) => {
                    setUserJwt(e.target.value);
                    setJwtFetched(false);
                  }}
                  placeholder="eyJhbG..."
                  autoComplete="off"
                />
              </label>
            </div>
            <button type="button" className="btn-secondary" disabled={loading} onClick={runOAuthAuthorize}>
              POST /api/v1/oauth/authorize
            </button>
            <h3 className="section-subtitle">cURL 例</h3>
            <CodeBlock code={oauthAuthorizeCurl} />
          </div>

          <div className="card">
            <h2>Step 2 — access_token 取得（サーバー側）</h2>
            <div className="form-grid">
              <label className="field-label">
                authorization code
                <input value={authCode} onChange={(e) => setAuthCode(e.target.value)} placeholder="code from step 1" />
              </label>
              <label className="field-label">
                client_id
                <input value={clientId} onChange={(e) => setClientId(e.target.value)} />
              </label>
              <label className="field-label">
                client_secret
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="sec_..."
                  autoComplete="off"
                />
              </label>
            </div>
            <p className="hint">
              <Link href="/oauth-clients">OAuth クライアント管理</Link> で発行した client_secret を使用します。
            </p>
            <button type="button" className="btn-secondary" disabled={loading} onClick={runOAuthToken}>
              POST /api/v1/oauth/token
            </button>
            <h3 className="section-subtitle">cURL 例</h3>
            <CodeBlock code={oauthTokenCurl} />
          </div>

          <div className="card">
            <h2>Step 3 — アバター API 呼び出し</h2>
            <div className="form-grid">
              <label className="field-label field-label-wide">
                access_token
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="token from step 2"
                  autoComplete="off"
                />
              </label>
            </div>
            <button type="button" className="btn-primary" disabled={loading} onClick={runBearerRequest}>
              {loading ? '送信中...' : `${path} を呼び出す`}
            </button>
            <h3 className="section-subtitle">cURL 例</h3>
            <CodeBlock code={oauthFetchCurl} />
            <h3 className="section-subtitle">JavaScript 例</h3>
            <CodeBlock code={oauthFetchJs} />
          </div>
        </>
      )}

      {error && <p className="form-error">{error}</p>}
      <ResponsePanel result={result} onClear={clearResult} />

      <div className="card">
        <h2>前提条件チェックリスト</h2>
        <ul className="checklist">
          <li>運営者アカウントが <strong>active</strong>（管理者承認済み）</li>
          <li>API キーまたは OAuth クライアントを発行済み</li>
          <li>対象ユーザーがアバターの <strong>外部連携 ON</strong></li>
          <li>管理者がアバターを <strong>公開</strong> 済み</li>
          <li>複数アバターがある場合、一覧から <strong>アバター ID</strong> で使う1体を指定</li>
          <li>
            パーツ選択式アバターは AMS サイト内で保存済み（VRM/GLB 生成済み）。
            SDK は <strong>/model</strong> でファイル取得のみ — パーツ組み立て API は使いません
          </li>
        </ul>
      </div>
    </main>
  );
}

export default function SandboxPage() {
  return (
    <RequireAuth>
      <SandboxContent />
    </RequireAuth>
  );
}
