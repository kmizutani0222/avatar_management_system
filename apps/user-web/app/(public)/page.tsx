import Link from 'next/link';
import { fetchHealth } from '@/lib/api';

export default async function HomePage() {
  const health = await fetchHealth();

  return (
    <div className="ams-auth-page user-landing-page">
      <div className="ams-landing">
        <h1>マイアバター</h1>
        <p className="subtitle">自分専用のアバターを作成・管理</p>

        <div className="card">
          <h2>API 接続状態</h2>
          <p>
            {health.ok ? (
              <span className="status-ok">接続 OK — {health.data?.service}</span>
            ) : (
              <span className="status-error">接続失敗 — API を確認してください</span>
            )}
          </p>
        </div>

        <div className="card actions-card">
          <Link href="/login" className="btn-primary">
            ログイン
          </Link>
          <Link href="/register" className="btn-secondary">
            新規登録
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            ダッシュボード
          </Link>
        </div>
      </div>
    </div>
  );
}
