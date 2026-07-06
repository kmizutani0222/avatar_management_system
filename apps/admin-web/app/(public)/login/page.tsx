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
        <span className="ams-sidebar-badge">Admin</span>
        <h1>管理者ログイン</h1>
        <p className="subtitle">管理画面にアクセスするにはログインしてください</p>
        <LoginForm onSuccess={() => router.push('/dashboard')} />
        <p className="hint">
          テストアカウント: admin@example.com / admin123456
        </p>
        <p className="footer-link">
          <Link href="/">トップに戻る</Link>
        </p>
      </div>
    </div>
  );
}
