import Link from 'next/link';
import { fetchHealth } from '@/lib/api';

export default async function HomePage() {
  const health = await fetchHealth();

  return (
    <main>
      <span className="badge badge-admin">Admin :4000</span>
      <h1>管理画面</h1>
      <p className="subtitle">ユーザー管理・パーツ管理・アバター管理</p>

      <div className="card">
        <h2>API 接続状態</h2>
        <p>
          {health.ok ? (
            <span className="status-ok">接続 OK — {health.data?.service}</span>
          ) : (
            <span className="status-error">接続失敗 — API (:4003) を確認してください</span>
          )}
        </p>
      </div>

      <div className="card actions-card">
        <Link href="/login" className="btn-primary">
          ログイン
        </Link>
        <Link href="/dashboard" className="btn-secondary">
          ダッシュボード
        </Link>
      </div>
    </main>
  );
}
