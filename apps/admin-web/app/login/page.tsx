'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@ams/web-auth';
import { useAuth } from '@ams/web-auth';
import { useEffect } from 'react';

export default function LoginPage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && profile) router.replace('/dashboard');
  }, [isLoading, profile, router]);

  return (
    <main>
      <span className="badge badge-admin">Admin :4000</span>
      <h1>管理者ログイン</h1>
      <p className="subtitle">管理画面にアクセスするにはログインしてください</p>
      <div className="card">
        <LoginForm onSuccess={() => router.push('/dashboard')} />
        <p className="hint">
          テストアカウント: admin@example.com / admin123456
        </p>
      </div>
      <p className="footer-link">
        <Link href="/">トップに戻る</Link>
      </p>
    </main>
  );
}
