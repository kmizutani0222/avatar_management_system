'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RegisterForm, useAuth } from '@ams/web-auth';

export default function RegisterPage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && profile) router.replace('/dashboard');
  }, [isLoading, profile, router]);

  return (
    <div className="ams-auth-page">
      <div className="ams-auth-card">
        <h1>新規登録</h1>
        <p className="subtitle">アバター管理アカウントを作成</p>
        <RegisterForm role="user" onSuccess={() => router.push('/dashboard')} />
        <p className="hint">
          すでにアカウントをお持ちの方は <Link href="/login">ログイン</Link>
        </p>
        <p className="footer-link">
          <Link href="/">トップに戻る</Link>
        </p>
      </div>
    </div>
  );
}
