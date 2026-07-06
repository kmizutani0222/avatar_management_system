'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@ams/web-auth';
import { authorizeOAuth, fetchOAuthClientInfo } from '@/lib/oauth';
import type { OAuthPublicClientInfo } from '@ams/shared-types';

function OAuthAuthorizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, token, isLoading } = useAuth();

  const clientId = searchParams.get('client_id') ?? '';
  const redirectUri = searchParams.get('redirect_uri') ?? '';
  const state = searchParams.get('state') ?? '';
  const responseType = searchParams.get('response_type') ?? 'code';

  const returnUrl = useMemo(() => {
    const qs = searchParams.toString();
    return `/oauth/authorize${qs ? `?${qs}` : ''}`;
  }, [searchParams]);

  const [clientInfo, setClientInfo] = useState<OAuthPublicClientInfo | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!profile) {
      router.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [isLoading, profile, router, returnUrl]);

  useEffect(() => {
    if (!clientId || !redirectUri) {
      setLoadError('client_id と redirect_uri が必要です');
      return;
    }
    if (responseType !== 'code') {
      setLoadError('response_type=code のみサポートしています');
      return;
    }

    setLoadError('');
    fetchOAuthClientInfo(clientId, redirectUri)
      .then(setClientInfo)
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'クライアント情報の取得に失敗しました'));
  }, [clientId, redirectUri, responseType]);

  async function handleApprove() {
    if (!token || !clientId || !redirectUri) return;
    setSubmitting(true);
    setActionError('');
    try {
      const { code } = await authorizeOAuth(token, clientId, redirectUri);
      const target = new URL(redirectUri);
      target.searchParams.set('code', code);
      if (state) target.searchParams.set('state', state);
      window.location.href = target.toString();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : '連携の許可に失敗しました');
      setSubmitting(false);
    }
  }

  function handleDeny() {
    if (!redirectUri) return;
    const target = new URL(redirectUri);
    target.searchParams.set('error', 'access_denied');
    if (state) target.searchParams.set('state', state);
    window.location.href = target.toString();
  }

  if (isLoading || !profile) {
    return (
      <div className="ams-auth-page">
        <p className="loading-text">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="ams-auth-page">
      <div className="ams-auth-card user-oauth-card">
        <h1>アプリ連携の許可</h1>
        <p className="subtitle">外部サイトへのアバター連携</p>

      {loadError && (
        <div className="card">
          <p className="form-error">{loadError}</p>
          <p className="footer-link">
            <Link href="/dashboard">ダッシュボードに戻る</Link>
          </p>
        </div>
      )}

      {!loadError && clientInfo && (
        <div className="card">
          <p>
            <strong>{clientInfo.operatorName}</strong> のアプリ{' '}
            <strong>{clientInfo.name}</strong> が、あなたのアバター情報へのアクセスを求めています。
          </p>
          <ul className="hint-list">
            <li>公開設定かつ外部連携 ON のアバターが対象です</li>
            <li>許可後、認可 code が連携先サイトに返されます</li>
          </ul>
          {actionError && <p className="form-error">{actionError}</p>}
          <div className="field-row" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn-primary" disabled={submitting} onClick={handleApprove}>
              {submitting ? '処理中…' : '連携を許可する'}
            </button>
            <button type="button" className="btn-secondary" disabled={submitting} onClick={handleDeny}>
              拒否
            </button>
          </div>
        </div>
      )}

      <p className="footer-link">
        <Link href="/dashboard">ダッシュボードに戻る</Link>
      </p>
      </div>
    </div>
  );
}

export default function OAuthAuthorizePage() {
  return (
    <Suspense fallback={<p className="loading-text">読み込み中...</p>}>
      <OAuthAuthorizeContent />
    </Suspense>
  );
}
