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
    <main>
      <span className="badge badge-user">User :4001</span>
      <h1>新規登録</h1>
      <p className="subtitle">アバター管理アカウントを作成</p>
      <div className="card">
        <RegisterForm role="user" onSuccess={() => router.push('/dashboard')} />
        <p className="hint">
          すでにアカウントをお持ちの方は <Link href="/login">ログイン</Link>
        </p>
      </div>
    </main>
  );
}
