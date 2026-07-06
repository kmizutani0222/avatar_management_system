'use client';

import Link from 'next/link';
import { PageHeader } from '@ams/admin-ui';
import { useAuth, authFetch } from '@ams/web-auth';
import { getApiUrl } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { token } = useAuth();
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

  return (
    <>
      <PageHeader title="管理ダッシュボード" subtitle="AMS 全体の概要とクイックアクセス" />

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
        <h2>クイックアクセス</h2>
        <div className="nav-grid">
          <Link href="/users" className="nav-card">ユーザー管理</Link>
          <Link href="/parts" className="nav-card">パーツ管理</Link>
          <Link href="/templates" className="nav-card">ベーステンプレート</Link>
          <Link href="/settings/expressions" className="nav-card">表情モーフ設定</Link>
          <Link href="/avatars" className="nav-card">アバター管理</Link>
          <Link href="/operators" className="nav-card">運営者管理</Link>
        </div>
      </div>
    </>
  );
}
