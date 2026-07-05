'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireAuth, useAuth } from '@ams/web-auth';
import type { ApiKeyCreated, ApiKeySummary } from '@ams/shared-types';
import { createApiKey, fetchApiKeys, revokeApiKey } from '@/lib/operator-api';

function ApiKeysContent() {
  const { token, profile } = useAuth();
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [name, setName] = useState('');
  const [created, setCreated] = useState<ApiKeyCreated | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const isActive = profile?.status === 'active';

  function reload() {
    if (!token) return;
    setLoading(true);
    fetchApiKeys(token)
      .then(setKeys)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !name.trim()) return;
    try {
      const result = await createApiKey(token, name.trim());
      setCreated(result);
      setName('');
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '発行に失敗しました');
    }
  }

  async function handleRevoke(id: string) {
    if (!token || !confirm('この API キーを無効化しますか？')) return;
    await revokeApiKey(token, id);
    reload();
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>API キー</h1>
          <p className="subtitle">外部 API 連携用</p>
        </div>
        <Link href="/dashboard" className="btn-secondary">ダッシュボード</Link>
      </header>

      {!isActive && (
        <p className="form-error">管理者の承認後に API キーを発行できます。</p>
      )}

      {isActive && (
        <div className="card">
          <h2>新規発行</h2>
          <form onSubmit={handleCreate} className="field-row">
            <label>
              キー名
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production" required />
            </label>
            <button type="submit" className="btn-primary">発行</button>
          </form>
          {created && (
            <div className="secret-box">
              <p><strong>発行しました。このキーは再表示できません:</strong></p>
              <p>{created.apiKey}</p>
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
                <th>レート制限</th>
                <th>状態</th>
                <th>作成日</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td>{key.name}</td>
                  <td>{key.rateLimit}/h</td>
                  <td>
                    <span className={`status-badge ${key.revokedAt ? 'status-inactive' : 'status-active'}`}>
                      {key.revokedAt ? '無効' : '有効'}
                    </span>
                  </td>
                  <td>{new Date(key.createdAt).toLocaleDateString('ja-JP')}</td>
                  <td>
                    {!key.revokedAt && isActive && (
                      <button type="button" className="btn-danger" onClick={() => handleRevoke(key.id)}>
                        無効化
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {keys.length === 0 && <p className="hint">API キーがありません</p>}
        </div>
      )}

      <div className="card">
        <h2>使い方</h2>
        <p className="hint">
          リクエストヘッダー: <code>X-API-Key</code> と <code>X-User-Id</code>（対象ユーザーの ID）を付与して
          <code> GET /api/v1/avatars</code> を呼び出します。
        </p>
      </div>
    </main>
  );
}

export default function ApiKeysPage() {
  return (
    <RequireAuth>
      <ApiKeysContent />
    </RequireAuth>
  );
}
