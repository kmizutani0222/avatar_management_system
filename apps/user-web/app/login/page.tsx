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
      <span className="badge badge-user">User :4001</span>
      <h1>ログイン</h1>
      <p className="subtitle">マイアバターにアクセス</p>
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
