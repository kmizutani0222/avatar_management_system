'use client';

import Link from 'next/link';
import { PageHeader } from '@ams/admin-ui';
import { useAuth } from '@ams/web-auth';
import { CopyButton } from '@/components/copy-button';
import { ProfileIcon } from '@/components/profile-icon';
import { XProfileLink } from '@/components/x-profile-link';

export default function AccountPage() {
  const { profile } = useAuth();

  return (
    <>
      <PageHeader
        title="アカウント"
        subtitle="プロフィールと連携用のユーザー情報"
        actions={
          <Link href="/account/edit" className="btn-primary">
            編集
          </Link>
        }
      />

      <div className="card account-view-card">
        <div className="account-view-header">
          <ProfileIcon size={96} />
          <div>
            <h2>{profile?.displayName ?? '—'}</h2>
            {profile?.xUsername && <XProfileLink username={profile.xUsername} />}
          </div>
        </div>

        {profile?.profileMessage && (
          <p className="account-profile-message">{profile.profileMessage}</p>
        )}

        <dl className="profile-dl">
          <dt>表示名</dt>
          <dd>{profile?.displayName ?? '—'}</dd>
          <dt>メール</dt>
          <dd>{profile?.email ?? '—'}</dd>
          <dt>X（旧 Twitter）</dt>
          <dd>
            {profile?.xUsername ? (
              <span>@{profile.xUsername.replace(/^@/, '').trim()}</span>
            ) : (
              <span className="subtitle">未設定</span>
            )}
          </dd>
          <dt>プロフィールメッセージ</dt>
          <dd>{profile?.profileMessage?.trim() ? profile.profileMessage : '—'}</dd>
          <dt>ユーザー ID</dt>
          <dd className="copy-id-inline">
            {profile?.id ? (
              <>
                <code className="id-value">{profile.id}</code>
                <CopyButton value={profile.id} />
              </>
            ) : (
              '—'
            )}
          </dd>
        </dl>

        <p className="hint">
          API キー方式の外部連携では、このユーザー ID を連携先サイトに登録します。
          OAuth 方式では AMS ログインで認可するため、ID の手入力は不要です。
        </p>
      </div>
    </>
  );
}
