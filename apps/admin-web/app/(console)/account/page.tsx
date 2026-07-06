'use client';

import Link from 'next/link';
import { PageHeader } from '@ams/admin-ui';
import { useAuth } from '@ams/web-auth';

const ADMIN_LEVEL_LABELS = {
  super: 'スーパー管理者',
  standard: '一般管理者',
} as const;

export default function AccountPage() {
  const { profile } = useAuth();

  const levelLabel =
    profile?.adminLevel && profile.adminLevel in ADMIN_LEVEL_LABELS
      ? ADMIN_LEVEL_LABELS[profile.adminLevel as keyof typeof ADMIN_LEVEL_LABELS]
      : '—';

  return (
    <>
      <PageHeader
        title="アカウント"
        subtitle="管理者アカウント情報"
        actions={
          <Link href="/account/edit" className="btn-primary">
            編集
          </Link>
        }
      />

      <div className="card">
        <dl className="profile-dl">
          <dt>名前</dt>
          <dd>{profile?.displayName ?? '—'}</dd>
          <dt>メール</dt>
          <dd>{profile?.email ?? '—'}</dd>
          <dt>権限</dt>
          <dd>{levelLabel}</dd>
          <dt>管理者 ID</dt>
          <dd>
            <code>{profile?.id ?? '—'}</code>
          </dd>
        </dl>
      </div>
    </>
  );
}
