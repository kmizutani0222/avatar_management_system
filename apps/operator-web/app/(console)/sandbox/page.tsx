'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@ams/admin-ui';
import AmsClient, { type ExternalAvatar } from '@ams/sdk-web';
import { useAuth } from '@ams/web-auth';
import { getApiUrl } from '@/lib/api';
import {
  sandboxOAuthAuthorizeRequest,
  sandboxOAuthTokenRequest,
  sandboxUserLogin,
} from '@/lib/sandbox-api';
import {
  buildOAuthAuthorizeUrl,
  getDefaultOAuthRedirectUri,
  SANDBOX_OAUTH_CLIENT_ID_KEY,
  SANDBOX_OAUTH_CODE_KEY,
  SANDBOX_OAUTH_ERROR_KEY,
} from '@/lib/oauth-url';
import { presetToExpressions } from '@/components/sandbox-model-preview';

const SandboxModelPreview = dynamic(
  () => import('@/components/sandbox-model-preview').then((m) => m.SandboxModelPreview),
  {
    ssr: false,
    loading: () => <div className="sandbox-preview-loading">3D プレビューを読み込み中…</div>,
  },
);

type AuthMode = 'oauth' | 'api-key';

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

function ResultBox({
  label,
  data,
  error,
  durationMs,
}: {
  label: string;
  data?: unknown;
  error?: string;
  durationMs?: number;
}) {
  if (!data && !error) return null;
  return (
    <div className={`sdk-result-box ${error ? 'sdk-result-error' : 'sdk-result-ok'}`}>
      <div className="sdk-result-header">
        <strong>{label}</strong>
        {durationMs != null && <span>{durationMs}ms</span>}
      </div>
      {error ? (
        <pre className="response-body">{error}</pre>
      ) : (
        <pre className="response-body">{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  children,
  code,
  role,
}: {
  step: number | string;
  title: string;
  description: string;
  children?: React.ReactNode;
  code?: string;
  role?: 'user' | 'operator';
}) {
  return (
    <div className={`card sdk-step-card${role ? ` sdk-step-${role}` : ''}`}>
      <div className="sdk-step-header">
        <span className="sdk-step-badge">Step {step}</span>
        {role && (
          <span className={`sdk-role-badge sdk-role-${role}`}>
            {role === 'user' ? 'ユーザー側' : '運営者側'}
          </span>
        )}
        <h2>{title}</h2>
      </div>
      <p className="hint">{description}</p>
      {children}
      {code && (
        <>
          <h3 className="section-subtitle">実装イメージ</h3>
          <CodeBlock code={code} />
        </>
      )}
    </div>
  );
}

export default function SandboxPage() {
  const { profile } = useAuth();
  const defaultBase = getApiUrl();
  const isActive = profile?.status === 'active';

  const [authMode, setAuthMode] = useState<AuthMode>('oauth');
  const [apiBase, setApiBase] = useState(defaultBase);

  // OAuth — ユーザー側（開発用シミュレータ入力）
  const [clientId, setClientId] = useState('');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [userPassword, setUserPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [oauthRedirectUri, setOauthRedirectUri] = useState('');
  const [linkedUserId, setLinkedUserId] = useState('');

  // OAuth — 運営者側
  const [clientSecret, setClientSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');

  // API キー — 運営者側のみ
  const [apiKey, setApiKey] = useState('');
  const [userId, setUserId] = useState('');

  const [loading, setLoading] = useState(false);
  const [userStepError, setUserStepError] = useState('');
  const [operatorStepError, setOperatorStepError] = useState('');

  const [avatars, setAvatars] = useState<ExternalAvatar[]>([]);
  const [listMeta, setListMeta] = useState<{ ms?: number; error?: string }>({});
  const [selectedId, setSelectedId] = useState('');
  const [avatarDetail, setAvatarDetail] = useState<ExternalAvatar | null>(null);
  const [detailMeta, setDetailMeta] = useState<{ ms?: number; error?: string }>({});
  const [modelBytes, setModelBytes] = useState<number | null>(null);
  const [modelMeta, setModelMeta] = useState<{ ms?: number; error?: string }>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const client = useMemo(() => {
    if (authMode === 'oauth' && accessToken.trim()) {
      return new AmsClient({ apiBase, accessToken: accessToken.trim() });
    }
    if (authMode === 'api-key' && apiKey.trim() && userId.trim()) {
      return new AmsClient({ apiBase, apiKey: apiKey.trim(), userId: userId.trim() });
    }
    return null;
  }, [authMode, apiBase, accessToken, apiKey, userId]);

  const operatorSetupCode = `// 運営者: OAuth クライアントを発行（管理画面）
// client_id  → 連携リクエスト・認可画面で使用
// client_secret → サーバー環境変数のみ（絶対にフロントに載せない）

const AMS_CLIENT_ID = process.env.AMS_CLIENT_ID;
const AMS_CLIENT_SECRET = process.env.AMS_CLIENT_SECRET;`;

  const userSideCode = `// 外部サイト（ユーザーが操作する画面）
function connectAms() {
  const params = new URLSearchParams({
    client_id: process.env.AMS_CLIENT_ID!,
    redirect_uri: 'https://your-site.com/oauth/callback',
    response_type: 'code',
    state: crypto.randomUUID(), // CSRF 対策（任意）
  });
  window.location.href = \`https://user.ams.example/oauth/authorize?\${params}\`;
}`;

  useEffect(() => {
    const redirectUri = getDefaultOAuthRedirectUri();
    setOauthRedirectUri(redirectUri);

    const storedClientId = sessionStorage.getItem(SANDBOX_OAUTH_CLIENT_ID_KEY);
    if (storedClientId) {
      setClientId(storedClientId);
      sessionStorage.removeItem(SANDBOX_OAUTH_CLIENT_ID_KEY);
    }

    const storedCode = sessionStorage.getItem(SANDBOX_OAUTH_CODE_KEY);
    if (storedCode) {
      setAuthCode(storedCode);
      sessionStorage.removeItem(SANDBOX_OAUTH_CODE_KEY);
    }

    const storedError = sessionStorage.getItem(SANDBOX_OAUTH_ERROR_KEY);
    if (storedError) {
      setUserStepError(storedError === 'access_denied' ? '連携が拒否されました' : `連携エラー: ${storedError}`);
      sessionStorage.removeItem(SANDBOX_OAUTH_ERROR_KEY);
    }
  }, []);

  const apiKeyOperatorCode = `// 運営者サーバー: API キーを環境変数で保持（ブラウザに載せない）
const AMS_API_KEY = process.env.AMS_API_KEY;`;

  const apiKeyUserCode = `// 連携対象ユーザーが AMS ダッシュボード（:4001）で ID を確認
// アカウント欄に表示される UUID を、外部サイト連携時に運営者へ伝える
// （本番では自サイトのアカウント紐付けフロー等で取得）`;

  const operatorTokenCode = `// 外部サイトバックエンド（client_secret はサーバーだけで保持）
async function onAmsCallback(code: string) {
  const accessToken = await exchangeAmsCode({
    code,
    clientId: process.env.AMS_CLIENT_ID,
    clientSecret: process.env.AMS_CLIENT_SECRET,
  });
  // セッションに保存するか、フロントへ安全に渡す
  return accessToken;
}`;

  const clientInitCode = useMemo(() => {
    if (authMode === 'oauth') {
      return `import AmsClient from '@ams/sdk-web';

const client = new AmsClient({
  apiBase: '${apiBase}',
  accessToken, // Step 2 で取得したトークン
});`;
    }
    return `import AmsClient from '@ams/sdk-web';

// サーバーサイドのみ
const client = new AmsClient({
  apiBase: '${apiBase}',
  apiKey: process.env.AMS_API_KEY,  // Step 1-A
  userId: '${userId || 'USER_UUID'}', // Step 1-B（連携対象ユーザー）
});`;
  }, [authMode, apiBase, userId]);

  const listCode = `const avatars = await client.listAvatars();`;
  const detailCode = `const avatar = await client.getAvatar('${selectedId || 'AVATAR_ID'}');`;
  const modelCode = `import { loadAmsModel } from '@ams/sdk-three';

const loaded = await loadAmsModel(client, '${selectedId || 'AVATAR_ID'}');`;

  const presetNames = avatarDetail ? Object.keys(avatarDetail.expressionPresets ?? {}) : [];

  const activeExpressions = useMemo(() => {
    if (!avatarDetail || !activePreset) return {};
    return presetToExpressions(avatarDetail.expressionPresets[activePreset] ?? {});
  }, [avatarDetail, activePreset]);

  async function runUserLinkSimulate() {
    if (!clientId.trim()) {
      setUserStepError('Step 1-A で client_id を入力してください（運営者が発行した OAuth クライアント）');
      return;
    }
    if (!userEmail.trim() || !userPassword) {
      setUserStepError('テストユーザーの email / password を入力してください');
      return;
    }
    const redirectUri = oauthRedirectUri || getDefaultOAuthRedirectUri();
    setLoading(true);
    setUserStepError('');
    try {
      const login = await sandboxUserLogin({
        apiBase,
        email: userEmail.trim(),
        password: userPassword,
      });
      const auth = await sandboxOAuthAuthorizeRequest({
        apiBase,
        userJwt: login.accessToken,
        clientId: clientId.trim(),
        redirectUri,
      });
      if (!auth.ok || !auth.code) {
        throw new Error(auth.bodyText || '認可コード取得に失敗しました');
      }
      setAuthCode(auth.code);
      setOauthRedirectUri(redirectUri);
      setLinkedUserId(login.userId);
    } catch (e) {
      setUserStepError(e instanceof Error ? e.message : 'AMS 連携のシミュレートに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  function runUserLinkBrowser() {
    if (!clientId.trim()) {
      setUserStepError('Step 1-A で client_id を入力してください');
      return;
    }
    const redirectUri = oauthRedirectUri || getDefaultOAuthRedirectUri();
    setOauthRedirectUri(redirectUri);
    setUserStepError('');
    sessionStorage.setItem(SANDBOX_OAUTH_CLIENT_ID_KEY, clientId.trim());
    const url = buildOAuthAuthorizeUrl({
      clientId: clientId.trim(),
      redirectUri,
      state: 'sandbox',
    });
    window.location.href = url;
  }

  async function runOperatorTokenExchange() {
    if (!authCode.trim() || !clientId.trim() || !clientSecret.trim()) {
      setOperatorStepError('認可 code / client_id / client_secret を入力してください');
      return;
    }
    setLoading(true);
    setOperatorStepError('');
    try {
      const token = await sandboxOAuthTokenRequest({
        apiBase,
        grantType: 'authorization_code',
        code: authCode.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        redirectUri: oauthRedirectUri || getDefaultOAuthRedirectUri(),
      });
      if (!token.ok || !token.accessToken) {
        throw new Error(token.bodyText || 'access_token 取得に失敗しました');
      }
      setAccessToken(token.accessToken);
    } catch (e) {
      setOperatorStepError(e instanceof Error ? e.message : 'access_token 取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  const runListAvatars = useCallback(async () => {
    if (!client) {
      setListMeta({ error: '認証ステップを完了してください' });
      return;
    }
    setLoading(true);
    setListMeta({});
    setAvatars([]);
    setSelectedId('');
    setAvatarDetail(null);
    setModelBytes(null);
    const start = performance.now();
    try {
      const list = await client.listAvatars();
      const usable = list.filter((a) => a.hasModel);
      setAvatars(usable);
      setSelectedId(usable[0]?.id ?? '');
      setListMeta({ ms: Math.round(performance.now() - start) });
    } catch (e) {
      setListMeta({
        ms: Math.round(performance.now() - start),
        error: e instanceof Error ? e.message : 'listAvatars に失敗しました',
      });
    } finally {
      setLoading(false);
    }
  }, [client]);

  const runGetAvatar = useCallback(async () => {
    if (!client || !selectedId) {
      setDetailMeta({ error: 'アバターを選択してください' });
      return;
    }
    setLoading(true);
    setDetailMeta({});
    setAvatarDetail(null);
    setModelBytes(null);
    setActivePreset(null);
    const start = performance.now();
    try {
      const detail = await client.getAvatar(selectedId);
      setAvatarDetail(detail);
      setActivePreset(Object.keys(detail.expressionPresets ?? {})[0] ?? null);
      setDetailMeta({ ms: Math.round(performance.now() - start) });
    } catch (e) {
      setDetailMeta({
        ms: Math.round(performance.now() - start),
        error: e instanceof Error ? e.message : 'getAvatar に失敗しました',
      });
    } finally {
      setLoading(false);
    }
  }, [client, selectedId]);

  const runFetchModel = useCallback(async () => {
    if (!client || !selectedId) {
      setModelMeta({ error: 'アバターを選択してください' });
      return;
    }
    setLoading(true);
    setModelMeta({});
    setModelBytes(null);
    const start = performance.now();
    try {
      const buffer = await client.fetchModel(selectedId);
      setModelBytes(buffer.byteLength);
      setModelMeta({ ms: Math.round(performance.now() - start) });
    } catch (e) {
      setModelMeta({
        ms: Math.round(performance.now() - start),
        error: e instanceof Error ? e.message : 'fetchModel に失敗しました',
      });
    } finally {
      setLoading(false);
    }
  }, [client, selectedId]);

  return (
    <>
      <PageHeader
        title="SDK サンドボックス"
        subtitle="ユーザー側（AMS 連携）と運営者側（SDK 実装）を分けて、ステップごとに試せます"
      />

      {!isActive && (
        <p className="form-error">
          運営者アカウントが承認されていません。OAuth クライアント / API キーは管理者承認後に利用できます。
        </p>
      )}

      <div className="card">
        <h2>OAuth 連携の全体像</h2>
        <ol className="checklist">
          <li>
            <strong>運営者側</strong> — OAuth クライアントを登録し <code>client_id</code> / <code>client_secret</code> を用意する
          </li>
          <li>
            <strong>ユーザー側</strong> — AMS アカウントでログインし、外部サイトへのアバター連携を<strong>許可</strong>する
          </li>
          <li>
            <strong>運営者側（サーバー）</strong> — 認可 code を access_token に交換する
          </li>
          <li>
            <strong>運営者側（SDK）</strong> — access_token を <code>AmsClient</code> に渡してアバターを取得する
          </li>
        </ol>
        <p className="hint">
          サンドボックスでは <strong>ブラウザ連携</strong>（AMS ログイン → 同意画面 → コールバック）を推奨します。
          email / password 入力は API 直接呼び出しの開発用代用です。
        </p>
      </div>

      <StepCard step={0} title="前提条件" description="連携テスト前に以下を確認してください。">
        <ul className="checklist">
          <li>運営者アカウントが <strong>active</strong></li>
          <li>
            <Link href="/oauth-clients">OAuth クライアント</Link> または{' '}
            <Link href="/api-keys">API キー</Link> を発行済み
          </li>
          <li>対象ユーザーがアバターの <strong>外部連携 ON</strong>（API キー方式）</li>
          <li>管理者がアバターを <strong>公開</strong> 済み</li>
          <li>API キー方式: 連携対象ユーザーの <strong>AMS ID</strong> を把握</li>
        </ul>
        <label className="field-label" style={{ marginTop: '1rem' }}>
          API ベース URL
          <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
        </label>
      </StepCard>

      <div className="sandbox-tabs">
        <button
          type="button"
          className={`sandbox-tab ${authMode === 'oauth' ? 'active' : ''}`}
          onClick={() => setAuthMode('oauth')}
        >
          OAuth 方式
        </button>
        <button
          type="button"
          className={`sandbox-tab ${authMode === 'api-key' ? 'active' : ''}`}
          onClick={() => setAuthMode('api-key')}
        >
          API キー方式
        </button>
      </div>

      {authMode === 'oauth' && (
        <>
          <StepCard
            step="1-A"
            role="operator"
            title="OAuth クライアントの設定"
            description="運営者が OAuth クライアントを発行し、client_id を連携フローに、client_secret をサーバーに設定します。ユーザーが入力する項目ではありません。"
            code={operatorSetupCode}
          >
            <div className="form-grid">
              <label className="field-label field-label-wide">
                client_id（連携先アプリ）
                <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="cli_..." />
              </label>
            </div>
            <p className="hint">
              <Link href="/oauth-clients">OAuth クライアント管理</Link> で発行します。
              client_secret は Step 1-C で使用します。
            </p>
          </StepCard>

          <StepCard
            step="1-B"
            role="user"
            title="AMS 連携 — ユーザーが許可する"
            description="本番では外部サイトに「AMS と連携」等の UI を置き、ユーザー自身が AMS（:4001）にログインして連携を許可します。redirect_uri は OAuth クライアント登録時に登録した URL と一致させてください。"
            code={userSideCode}
          >
            <p className="hint">
              redirect_uri: <code>{oauthRedirectUri || getDefaultOAuthRedirectUri()}</code>
              {' '}(<Link href="/oauth/callback">/oauth/callback</Link> — OAuth クライアント作成時に登録)
            </p>
            <button
              type="button"
              className="btn-primary"
              disabled={!isActive || !clientId.trim()}
              onClick={runUserLinkBrowser}
            >
              ブラウザで AMS 連携を開始（推奨）
            </button>
            <p className="hint">
              このタブのまま AMS ログイン → 同意 → サンドボックスへ戻ります（Google 認証と同様）。
            </p>
            <details style={{ marginTop: '1rem' }}>
              <summary className="hint">開発用: API でログイン＋認可をシミュレート</summary>
            <div className="form-grid" style={{ marginTop: '0.75rem' }}>
              <label className="field-label field-label-wide">
                <span>
                  開発用 — テストユーザー email / password
                  <small style={{ display: 'block', fontWeight: 400, color: 'var(--ams-text-muted)' }}>
                    ユーザー AMS ログインの代用（例: user@example.com / user123456）
                  </small>
                </span>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </label>
              <label className="field-label">
                パスワード（開発用）
                <input
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </label>
            </div>
            <button
              type="button"
              className="btn-secondary"
              disabled={loading || !isActive || !clientId.trim()}
              onClick={runUserLinkSimulate}
            >
              {loading ? '実行中…' : '開発用: ユーザーの AMS 連携をシミュレート'}
            </button>
            </details>
            {linkedUserId && (
              <p className="form-success">連携ユーザー ID: {linkedUserId}</p>
            )}
            {authCode && (
              <p className="form-success">認可 code 取得済み — Step 1-C へ進んでください</p>
            )}
            {userStepError && <p className="form-error">{userStepError}</p>}
          </StepCard>

          <StepCard
            step="1-C"
            role="operator"
            title="access_token 取得 — 運営者サーバー"
            description="Step 1-B で得た認可 code を、client_id + client_secret を使って access_token に交換します。"
            code={operatorTokenCode}
          >
            <div className="form-grid">
              <label className="field-label field-label-wide">
                認可 code（Step 1-B 実行後に自動入力）
                <input value={authCode} onChange={(e) => setAuthCode(e.target.value)} placeholder="code_..." />
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
              <label className="field-label field-label-wide">
                access_token（Step 1-C 実行後に自動入力、または手動貼り付け）
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  autoComplete="off"
                />
              </label>
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={loading || !isActive || !authCode}
              onClick={runOperatorTokenExchange}
            >
              {loading ? '実行中…' : '運営者サーバー処理: access_token を取得'}
            </button>
            {operatorStepError && <p className="form-error">{operatorStepError}</p>}
            {accessToken && (
              <p className="form-success">access_token 取得済み — Step 2（AmsClient）へ進めます</p>
            )}
          </StepCard>
        </>
      )}

      {authMode === 'api-key' && (
        <>
          <StepCard
            step="1-A"
            role="operator"
            title="API キーの設定"
            description="運営者サーバーで API キーを保持します。ブラウザには載せません。"
            code={apiKeyOperatorCode}
          >
            <div className="form-grid">
              <label className="field-label field-label-wide">
                API キー
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
              <Link href="/api-keys">API キー管理</Link> で発行します。
            </p>
            {apiKey.trim() && (
              <p className="form-success">API キー設定済み — Step 1-B で連携ユーザー ID を指定してください</p>
            )}
          </StepCard>

          <StepCard
            step="1-B"
            role="user"
            title="連携対象ユーザーの AMS ID"
            description="API キー方式では、どの AMS ユーザーのアバターを取得するか userId で指定します。ユーザーは AMS ダッシュボード（:4001）のアカウント欄で自分の ID を確認します。"
            code={apiKeyUserCode}
          >
            <div className="form-grid">
              <label className="field-label field-label-wide">
                AMS ユーザー ID
                <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="550e8400-..." />
              </label>
            </div>
            {client && (
              <p className="form-success">Step 1 完了 — Step 2（AmsClient）へ進めます</p>
            )}
          </StepCard>
        </>
      )}

      <StepCard
        step={2}
        role="operator"
        title="AmsClient の作成"
        description="Step 1 で得た認証情報を渡して SDK クライアントを作ります。以降はすべて SDK メソッドで操作します。"
        code={clientInitCode}
      >
        {client ? (
          <p className="hint status-ok">✓ client 準備完了</p>
        ) : (
          <p className="hint">Step 1 の認証を完了してください</p>
        )}
      </StepCard>

      <StepCard
        step={3}
        role="operator"
        title="client.listAvatars()"
        description="連携ユーザーが外部公開可能なアバター一覧を取得します。"
        code={listCode}
      >
        <button type="button" className="btn-primary" disabled={!client || loading} onClick={runListAvatars}>
          {loading ? '実行中…' : 'listAvatars() を実行'}
        </button>
        <ResultBox label="結果" data={avatars.length > 0 ? avatars : undefined} error={listMeta.error} durationMs={listMeta.ms} />
        {avatars.length > 0 && (
          <div className="field-row">
            <label>
              対象アバター
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                {avatars.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.format})
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </StepCard>

      <StepCard step={4} role="operator" title="client.getAvatar(id)" description="メタデータと expressionPresets を取得します。" code={detailCode}>
        <button type="button" className="btn-secondary" disabled={!client || !selectedId || loading} onClick={runGetAvatar}>
          {loading ? '実行中…' : 'getAvatar() を実行'}
        </button>
        <ResultBox label="結果" data={avatarDetail ?? undefined} error={detailMeta.error} durationMs={detailMeta.ms} />
        {presetNames.length > 0 && (
          <div className="field-row">
            <label>
              表情プリセット（プレビュー用）
              <select value={activePreset ?? ''} onChange={(e) => setActivePreset(e.target.value || null)}>
                {presetNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </StepCard>

      <StepCard
        step={5}
        role="operator"
        title="client.fetchModel() + loadAmsModel()"
        description="VRM/GLB を取得して Three.js に表示します。"
        code={modelCode}
      >
        <button type="button" className="btn-primary" disabled={!client || !selectedId || loading} onClick={runFetchModel}>
          {loading ? '実行中…' : 'fetchModel() を実行'}
        </button>
        <ResultBox
          label="結果"
          data={modelBytes != null ? { byteLength: modelBytes, size: `${(modelBytes / 1024).toFixed(1)} KB` } : undefined}
          error={modelMeta.error}
          durationMs={modelMeta.ms}
        />
        {client && selectedId && avatarDetail && modelBytes != null && !modelMeta.error && (
          <>
            <h3 className="section-subtitle">3D プレビュー</h3>
            <SandboxModelPreview
              client={client}
              avatarId={selectedId}
              sourceType={avatarDetail.sourceType}
              expressions={activeExpressions}
            />
          </>
        )}
      </StepCard>

      <div className="card">
        <h2>参考</h2>
        <p className="hint">
          SDK の詳細は <Link href="/sdk">SDK ガイド</Link>、OAuth クライアント設定は{' '}
          <Link href="/oauth-clients">OAuth クライアント管理</Link> を参照してください。
        </p>
      </div>
    </>
  );
}
