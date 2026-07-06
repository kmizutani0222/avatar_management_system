'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '@ams/admin-ui';
import { useAuth } from '@ams/web-auth';
import { updateOperatorProfile } from '@/lib/operator-profile';

export default function AccountEditPage() {
  const { profile, token, refreshProfile } = useAuth();
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setCompanyName(profile.companyName ?? '');
  }, [profile]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);
    try {
      await updateOperatorProfile(token, { companyName: companyName.trim() });
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
        subtitle="会社名の変更"
        actions={
          <Link href="/account" className="btn-secondary">
            閲覧に戻る
          </Link>
        }
      />

      <form className="card account-edit-form" onSubmit={handleSubmit}>
        <label className="field-label">
          会社名
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            maxLength={128}
          />
        </label>

        <p className="hint">メールアドレスの変更は管理者にお問い合わせください。</p>

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
