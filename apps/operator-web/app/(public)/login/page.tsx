'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoginForm, useAuth } from '@ams/web-auth';

export default function LoginPage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && profile) router.replace('/dashboard');
  }, [isLoading, profile, router]);

  return (
    <div className="ams-auth-page">
      <div className="ams-auth-card">
        <span className="ams-sidebar-badge">Operator</span>
        <h1>運営者ログイン</h1>
        <p className="subtitle">外部連携ポータルにアクセス</p>
        <LoginForm onSuccess={() => router.push('/dashboard')} />
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
