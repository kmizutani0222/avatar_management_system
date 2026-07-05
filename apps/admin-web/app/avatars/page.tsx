'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireAuth, useAuth } from '@ams/web-auth';
import {
  AdminAvatar,
  deleteAdminAvatar,
  fetchAdminAvatars,
  publishAdminAvatar,
  unpublishAdminAvatar,
} from '@/lib/admin-api';

function AvatarsContent() {
  const { token } = useAuth();
  const [avatars, setAvatars] = useState<AdminAvatar[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function reload() {
    if (!token) return;
    setLoading(true);
    fetchAdminAvatars(token)
      .then(setAvatars)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [token]);

  async function handlePublish(id: string) {
    if (!token) return;
    await publishAdminAvatar(token, id);
    reload();
  }

  async function handleUnpublish(id: string) {
    if (!token) return;
    await unpublishAdminAvatar(token, id);
    reload();
  }

  async function handleDelete(id: string) {
    if (!token || !confirm('このアバターを削除しますか？')) return;
    await deleteAdminAvatar(token, id);
    reload();
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>アバター管理</h1>
          <p className="subtitle">公開・非公開・削除</p>
        </div>
        <Link href="/dashboard" className="btn-secondary">ダッシュボード</Link>
      </header>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p className="loading-text">読み込み中...</p>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>名前</th>
                <th>所有者</th>
                <th>種別</th>
                <th>状態</th>
                <th>外部公開</th>
                <th>承認</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {avatars.map((avatar) => (
                <tr key={avatar.id}>
                  <td>{avatar.name}</td>
                  <td>{avatar.user.displayName}</td>
                  <td>{avatar.sourceType}</td>
                  <td>{avatar.status}</td>
                  <td>{avatar.externalEnabled ? 'ON' : 'OFF'}</td>
                  <td>
                    <span className={`status-badge ${avatar.adminApproved ? 'status-active' : 'status-inactive'}`}>
                      {avatar.adminApproved ? '承認済' : '未承認'}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button type="button" className="btn-secondary btn-sm" onClick={() => handlePublish(avatar.id)}>
                      公開
                    </button>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => handleUnpublish(avatar.id)}>
                      非公開
                    </button>
                    <button type="button" className="btn-danger" onClick={() => handleDelete(avatar.id)}>
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {avatars.length === 0 && <p className="hint">アバターがありません</p>}
        </div>
      )}
    </main>
  );
}

export default function AvatarsPage() {
  return (
    <RequireAuth>
      <AvatarsContent />
    </RequireAuth>
  );
}
