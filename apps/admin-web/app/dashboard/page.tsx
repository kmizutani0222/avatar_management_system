'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequireAuth, useAuth, authFetch } from '@ams/web-auth';
import { getApiUrl } from '@/lib/api';
import { useEffect, useState } from 'react';

function DashboardContent() {
  const { profile, token, logout } = useAuth();
  const router = useRouter();
  const [avatarCount, setAvatarCount] = useState<number | null>(null);
  const [partCount, setPartCount] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    authFetch(getApiUrl(), '/api/admin/avatars', token)
      .then((r) => r.json())
      .then((data) => setAvatarCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setAvatarCount(0));

    authFetch(getApiUrl(), '/api/parts/admin', token)
      .then((r) => r.json())
      .then((data) => setPartCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setPartCount(0));
  }, [token]);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <span className="badge badge-admin">Admin :4000</span>
          <h1>管理ダッシュボード</h1>
        </div>
        <button type="button" className="btn-secondary" onClick={handleLogout}>
          ログアウト
        </button>
      </header>

      <div className="card">
        <h2>ログイン中</h2>
        <dl className="profile-dl">
          <dt>名前</dt>
          <dd>{profile?.displayName ?? '—'}</dd>
          <dt>メール</dt>
          <dd>{profile?.email}</dd>
          <dt>ロール</dt>
          <dd>{profile?.role}</dd>
        </dl>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <h3>アバター</h3>
          <p className="stat-value">{avatarCount ?? '—'}</p>
        </div>
        <div className="card stat-card">
          <h3>パーツ</h3>
          <p className="stat-value">{partCount ?? '—'}</p>
        </div>
      </div>

      <div className="card">
        <h2>管理メニュー</h2>
        <div className="nav-grid">
          <Link href="/users" className="nav-card">ユーザー管理</Link>
          <Link href="/parts" className="nav-card">パーツ管理</Link>
          <Link href="/avatars" className="nav-card">アバター管理</Link>
          <Link href="/operators" className="nav-card">運営者管理</Link>
        </div>
      </div>

      <p className="footer-link">
        <Link href="/">トップに戻る</Link>
      </p>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
