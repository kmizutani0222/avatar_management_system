'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@ams/admin-ui';
import { useAuth } from '@ams/web-auth';
import type { AdminAccount } from '@ams/shared-types';
import { createAdmin, fetchAdmins } from '@/lib/admin-profile';

const LEVEL_LABELS = {
  super: 'スーパー管理者',
  standard: '一般管理者',
} as const;

export default function AdminsPage() {
  const { profile, token } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (profile && profile.adminLevel !== 'super') {
      router.replace('/dashboard');
    }
  }, [profile, router]);

  function reload() {
    if (!token) return;
    setLoading(true);
    fetchAdmins(token)
      .then(setAdmins)
      .catch((e) => setError(e instanceof Error ? e.message : '読み込みに失敗しました'))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [token]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setCreating(true);
    setError('');
    try {
      await createAdmin(token, { email: email.trim(), password, name: name.trim() });
      setEmail('');
      setPassword('');
      setName('');
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '管理者の追加に失敗しました');
    } finally {
      setCreating(false);
    }
  }

  if (profile?.adminLevel !== 'super') {
    return <p className="loading-text">読み込み中...</p>;
  }

  return (
    <>
      <PageHeader title="管理者" subtitle="一般管理者の追加と一覧（スーパー管理者のみ）" />

      {error && <p className="form-error">{error}</p>}

      <div className="card">
        <h2>管理者を追加</h2>
        <form className="form-grid" onSubmit={handleCreate}>
          <label className="field-label">
            名前
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={64}
            />
          </label>
          <label className="field-label">
            メール
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field-label">
            初期パスワード
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          <div className="field-block">
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? '追加中…' : '管理者を追加'}
            </button>
          </div>
        </form>
        <p className="form-hint">追加される管理者は一般管理者として登録されます。</p>
      </div>

      <div className="card">
        <h2>管理者一覧</h2>
        {loading ? (
          <p className="loading-text">読み込み中...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>名前</th>
                <th>メール</th>
                <th>権限</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>{LEVEL_LABELS[admin.level]}</td>
                  <td>{admin.isActive ? '有効' : '無効'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
