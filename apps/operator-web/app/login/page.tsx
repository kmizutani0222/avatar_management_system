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
    <main>
      <span className="badge badge-operator">Operator :4002</span>
      <h1>運営者ログイン</h1>
      <p className="subtitle">外部連携ポータルにアクセス</p>
      <div className="card">
        <LoginForm onSuccess={() => router.push('/dashboard')} />
        <p className="hint">
          アカウントをお持ちでない方は{' '}
          <Link href="/register">新規登録</Link>
        </p>
      </div>
      <p className="footer-link">
        <Link href="/">トップに戻る</Link>
      </p>
    </main>
  );
}
