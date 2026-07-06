'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { PageHeader } from '@ams/admin-ui';
import { useAuth } from '@ams/web-auth';
import { ProfileIcon } from '@/components/profile-icon';
import { XProfileLink } from '@/components/x-profile-link';
import { updateUserProfile, uploadProfileIcon } from '@/lib/user-profile';

export default function AccountEditPage() {
  const { profile, token, refreshProfile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [xUsername, setXUsername] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? '');
    setXUsername(profile.xUsername ?? '');
    setProfileMessage(profile.profileMessage ?? '');
  }, [profile]);

  async function handleIconChange(file: File | undefined) {
    if (!file || !token) return;
    setUploading(true);
    setError(null);
    try {
      await uploadProfileIcon(token, file);
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アイコンのアップロードに失敗しました');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);
    try {
      await updateUserProfile(token, {
        displayName: displayName.trim(),
        xUsername: xUsername.trim() ? xUsername.trim() : null,
        profileMessage: profileMessage.trim() ? profileMessage : null,
      });
      await refreshProfile();
      router.push('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  const previewHandle = xUsername.trim().replace(/^@/, '');

  return (
    <>
      <PageHeader
        title="アカウント編集"
        subtitle="表示名・X 連携・プロフィールの設定"
        actions={
          <Link href="/account" className="btn-secondary">
            閲覧に戻る
          </Link>
        }
      />

      <form className="card account-edit-card" onSubmit={handleSubmit}>
        <div className="account-edit-icon-row">
          <ProfileIcon size={80} />
          <div>
            <label className="field-label">
              プロフィールアイコン
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={uploading}
                onChange={(e) => handleIconChange(e.target.files?.[0])}
              />
            </label>
            <p className="hint">PNG / JPEG / WebP / GIF（最大 2MB）</p>
            {uploading && <p className="hint">アップロード中…</p>}
          </div>
        </div>

        <label className="field-label">
          表示名
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={100}
          />
        </label>

        <label className="field-label">
          X ユーザー名
          <input
            type="text"
            value={xUsername}
            onChange={(e) => setXUsername(e.target.value)}
            placeholder="username（@ なし）"
            maxLength={15}
            autoComplete="off"
          />
        </label>
        {previewHandle && (
          <div className="account-x-preview">
            <span className="hint">プレビュー:</span>
            <XProfileLink username={previewHandle} />
          </div>
        )}

        <label className="field-label">
          プロフィールメッセージ
          <textarea
            className="account-textarea"
            value={profileMessage}
            onChange={(e) => setProfileMessage(e.target.value)}
            placeholder="自己紹介や一言メッセージ"
            maxLength={500}
            rows={4}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="account-edit-actions">
          <button type="submit" className="btn-primary" disabled={saving || uploading}>
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
