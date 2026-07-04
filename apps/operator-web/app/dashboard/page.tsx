'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequireAuth, useAuth } from '@ams/web-auth';

function DashboardContent() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const apiDocsUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4003'}/api/docs`;

  return (
    <main>
      <header className="page-header">
        <div>
          <span className="badge badge-operator">Operator :4002</span>
          <h1>運営者ダッシュボード</h1>
        </div>
        <button type="button" className="btn-secondary" onClick={handleLogout}>
          ログアウト
        </button>
      </header>

      <div className="card">
        <h2>アカウント</h2>
        <dl className="profile-dl">
          <dt>会社名</dt>
          <dd>{profile?.companyName ?? '—'}</dd>
          <dt>メール</dt>
          <dd>{profile?.email}</dd>
          <dt>ステータス</dt>
          <dd>{profile?.status ?? '—'}</dd>
        </dl>
        {profile?.status === 'pending' && (
          <p className="hint">管理者の承認後、API キー発行が可能になります（Phase 5）。</p>
        )}
      </div>

      <div className="card">
        <h2>外部連携（Phase 5 以降）</h2>
        <ul>
          <li>OAuth クライアント管理</li>
          <li>API キー発行・ローテーション</li>
          <li>利用状況ダッシュボード</li>
        </ul>
        <p className="hint">
          API ドキュメント: <a href={apiDocsUrl} target="_blank" rel="noreferrer">Swagger UI</a>
        </p>
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
