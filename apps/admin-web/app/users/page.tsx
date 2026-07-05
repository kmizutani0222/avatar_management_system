'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireAuth, useAuth } from '@ams/web-auth';
import { AdminUser, fetchAdminUsers, updateAdminUser } from '@/lib/admin-api';

function UsersContent() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function reload() {
    if (!token) return;
    setLoading(true);
    fetchAdminUsers(token)
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [token]);

  async function toggleActive(user: AdminUser) {
    if (!token) return;
    try {
      await updateAdminUser(token, user.id, { isActive: !user.isActive });
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新に失敗しました');
    }
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>ユーザー管理</h1>
          <p className="subtitle">登録ユーザーの一覧・有効/無効切替</p>
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
                <th>表示名</th>
                <th>メール</th>
                <th>アバター数</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.displayName}</td>
                  <td>{user.email}</td>
                  <td>{user._count.avatars}</td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                      {user.isActive ? '有効' : '無効'}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => toggleActive(user)}>
                      {user.isActive ? '無効化' : '有効化'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default function UsersPage() {
  return (
    <RequireAuth>
      <UsersContent />
    </RequireAuth>
  );
}
