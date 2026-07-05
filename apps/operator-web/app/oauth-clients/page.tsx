'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireAuth, useAuth } from '@ams/web-auth';
import type { OAuthClientCreated, OAuthClientSummary } from '@ams/shared-types';
import {
  createOAuthClient,
  deactivateOAuthClient,
  fetchOAuthClients,
} from '@/lib/operator-api';

function OAuthClientsContent() {
  const { token, profile } = useAuth();
  const [clients, setClients] = useState<OAuthClientSummary[]>([]);
  const [name, setName] = useState('');
  const [created, setCreated] = useState<OAuthClientCreated | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const isActive = profile?.status === 'active';

  function reload() {
    if (!token) return;
    setLoading(true);
    fetchOAuthClients(token)
      .then(setClients)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !name.trim()) return;
    try {
      const result = await createOAuthClient(token, name.trim());
      setCreated(result);
      setName('');
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '作成に失敗しました');
    }
  }

  async function handleDeactivate(id: string) {
    if (!token || !confirm('この OAuth クライアントを無効化しますか？')) return;
    await deactivateOAuthClient(token, id);
    reload();
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>OAuth クライアント</h1>
          <p className="subtitle">ユーザー認可フロー用</p>
        </div>
        <Link href="/dashboard" className="btn-secondary">ダッシュボード</Link>
      </header>

      {!isActive && (
        <p className="form-error">管理者の承認後に OAuth クライアントを作成できます。</p>
      )}

      {isActive && (
        <div className="card">
          <h2>新規作成</h2>
          <form onSubmit={handleCreate} className="field-row">
            <label>
              アプリ名
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My App" required />
            </label>
            <button type="submit" className="btn-primary">作成</button>
          </form>
          {created && (
            <div className="secret-box">
              <p><strong>client_id:</strong> {created.clientId}</p>
              <p><strong>client_secret（再表示不可）:</strong> {created.clientSecret}</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p className="loading-text">読み込み中...</p>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>名前</th>
                <th>client_id</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td><code>{client.clientId}</code></td>
                  <td>
                    <span className={`status-badge ${client.isActive ? 'status-active' : 'status-inactive'}`}>
                      {client.isActive ? '有効' : '無効'}
                    </span>
                  </td>
                  <td>
                    {client.isActive && isActive && (
                      <button type="button" className="btn-danger" onClick={() => handleDeactivate(client.id)}>
                        無効化
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && <p className="hint">OAuth クライアントがありません</p>}
        </div>
      )}

      <div className="card">
        <h2>OAuth フロー</h2>
        <ol className="hint" style={{ paddingLeft: '1.25rem', marginTop: '0.75rem' }}>
          <li>ユーザーが JWT で <code>POST /api/v1/oauth/authorize</code> に clientId を送信 → code 取得</li>
          <li><code>POST /api/v1/oauth/token</code> で code を access_token に交換</li>
          <li><code>Authorization: Bearer &lt;token&gt;</code> で <code>GET /api/v1/avatars</code></li>
        </ol>
      </div>
    </main>
  );
}

export default function OAuthClientsPage() {
  return (
    <RequireAuth>
      <OAuthClientsContent />
    </RequireAuth>
  );
}
