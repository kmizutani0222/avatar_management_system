'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '@ams/admin-ui';
import { useAuth } from '@ams/web-auth';
import { updateAdminProfile } from '@/lib/admin-profile';

export default function AccountEditPage() {
  const { profile, token, refreshProfile } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.displayName ?? '');
  }, [profile]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);
    try {
      await updateAdminProfile(token, { name: name.trim() });
      await refreshProfile();
      router.push('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="アカウント編集"
        subtitle="表示名の変更"
        actions={
          <Link href="/account" className="btn-secondary">
            閲覧に戻る
          </Link>
        }
      />

      <form className="card account-edit-card" onSubmit={handleSubmit}>
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

        <p className="hint">メールアドレスの変更はシステム管理者にお問い合わせください。</p>

        {error && <p className="form-error">{error}</p>}

        <div className="account-edit-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
          <Link href="/account" className="btn-secondary">
            キャンセル
          </Link>
        </div>
      </form>
    </>
  );
}
