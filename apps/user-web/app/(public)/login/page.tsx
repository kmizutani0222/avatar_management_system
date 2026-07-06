'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { LoginForm, useAuth } from '@ams/web-auth';

function safeReturnUrl(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/dashboard';
}

function LoginContent() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = safeReturnUrl(searchParams.get('returnUrl'));

  useEffect(() => {
    if (!isLoading && profile) router.replace(returnUrl);
  }, [isLoading, profile, router, returnUrl]);

  return (
    <div className="ams-auth-page">
      <div className="ams-auth-card">
        <h1>ログイン</h1>
        <p className="subtitle">マイアバターにアクセス</p>
        <LoginForm onSuccess={() => router.push(returnUrl)} />
        <p className="hint">
          アカウントをお持ちでない方は{' '}
          <Link href="/register">新規登録</Link>
        </p>
        <p className="footer-link">
          <Link href="/">トップに戻る</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="loading-text">読み込み中...</p>}>
      <LoginContent />
    </Suspense>
  );
}
