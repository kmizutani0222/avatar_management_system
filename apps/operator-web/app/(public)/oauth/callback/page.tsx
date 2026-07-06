'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import {
  SANDBOX_OAUTH_CODE_KEY,
  SANDBOX_OAUTH_ERROR_KEY,
  SANDBOX_OAUTH_RETURN_PATH,
} from '@/lib/oauth-url';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  useEffect(() => {
    if (code) {
      sessionStorage.setItem(SANDBOX_OAUTH_CODE_KEY, code);
      router.replace(SANDBOX_OAUTH_RETURN_PATH);
      return;
    }
    if (error) {
      sessionStorage.setItem(SANDBOX_OAUTH_ERROR_KEY, error);
      router.replace(SANDBOX_OAUTH_RETURN_PATH);
    }
  }, [code, error, router]);

  return (
    <div className="ams-auth-page">
      <div className="ams-auth-card">
        <span className="ams-sidebar-badge">OAuth Callback</span>
        <h1>連携処理中…</h1>
        <p className="hint">サンドボックスへ戻ります。</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<p className="loading-text">読み込み中...</p>}>
      <OAuthCallbackContent />
    </Suspense>
  );
}
