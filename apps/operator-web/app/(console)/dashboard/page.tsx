'use client';

import Link from 'next/link';
import { PageHeader } from '@ams/admin-ui';
import { useAuth } from '@ams/web-auth';

export default function DashboardPage() {
  const { profile } = useAuth();
  const apiDocsUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4003'}/api/docs`;

  return (
    <>
      <PageHeader title="運営者ダッシュボード" subtitle="外部連携の概要とクイックアクセス" />

      <div className="card">
        <h2>アカウント</h2>
        <dl className="profile-dl">
          <dt>会社名</dt>
          <dd>{profile?.companyName ?? '—'}</dd>
          <dt>メール</dt>
          <dd>{profile?.email}</dd>
          <dt>ステータス</dt>
          <dd>
            <span className={`status-badge status-${profile?.status === 'active' ? 'active' : profile?.status === 'pending' ? 'pending' : 'inactive'}`}>
              {profile?.status ?? '—'}
            </span>
          </dd>
        </dl>
        {profile?.status === 'pending' && (
          <p className="hint">管理者の承認後、API キー発行が可能になります。</p>
        )}
      </div>

      <div className="card">
        <h2>外部連携</h2>
        {profile?.status === 'active' ? (
          <div className="nav-grid">
            <Link href="/oauth-clients" className="nav-card">OAuth クライアント</Link>
            <Link href="/api-keys" className="nav-card">API キー</Link>
            <Link href="/sandbox" className="nav-card">SDK サンドボックス</Link>
            <Link href="/sdk" className="nav-card">SDK ガイド</Link>
          </div>
        ) : (
          <p className="hint">承認待ちのため、外部連携機能は利用できません。</p>
        )}
        <p className="hint">
          API ドキュメント: <a href={apiDocsUrl} target="_blank" rel="noreferrer">Swagger UI</a>
        </p>
      </div>
    </>
  );
}
