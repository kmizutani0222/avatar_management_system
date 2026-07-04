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
      <span className="badge badge-operator">Operator :4002</span>
      <h1>運営者登録</h1>
      <p className="subtitle">外部連携用アカウントを作成（管理者承認待ち）</p>
      <div className="card">
        <RegisterForm role="operator" onSuccess={() => router.push('/dashboard')} />
        <p className="hint">
          すでにアカウントをお持ちの方は <Link href="/login">ログイン</Link>
        </p>
      </div>
    </main>
  );
}
