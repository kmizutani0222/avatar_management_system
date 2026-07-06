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
        <h2>外部連携</h2>
        {profile?.status === 'active' ? (
          <div className="nav-grid">
            <Link href="/oauth-clients" className="nav-card">OAuth クライアント</Link>
            <Link href="/api-keys" className="nav-card">API キー</Link>
            <Link href="/integration-guide" className="nav-card">導入手順書</Link>
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
