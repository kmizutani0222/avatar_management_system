'use client';

import Link from 'next/link';
import { PageHeader } from '@ams/admin-ui';
import { useAuth } from '@ams/web-auth';

const STATUS_LABELS: Record<string, string> = {
  pending: '承認待ち',
  active: '有効',
  suspended: '停止中',
};

export default function AccountPage() {
  const { profile } = useAuth();

  const status = profile?.status ?? '';
  const statusLabel = STATUS_LABELS[status] ?? status ?? '—';

  return (
    <>
      <PageHeader
        title="アカウント"
        subtitle="運営者アカウント情報"
        actions={
          <Link href="/account/edit" className="btn-primary">
            編集
          </Link>
        }
      />

      <div className="card">
        <dl className="profile-dl">
          <dt>会社名</dt>
          <dd>{profile?.companyName ?? '—'}</dd>
          <dt>メール</dt>
          <dd>{profile?.email ?? '—'}</dd>
          <dt>ステータス</dt>
          <dd>
            <span
              className={`status-badge status-${status === 'active' ? 'active' : status === 'pending' ? 'pending' : 'inactive'}`}
            >
              {statusLabel}
            </span>
          </dd>
          <dt>運営者 ID</dt>
          <dd>
            <code>{profile?.id ?? '—'}</code>
          </dd>
        </dl>
        {profile?.status === 'pending' && (
          <p className="hint">管理者の承認後、API キー発行が可能になります。</p>
        )}
      </div>
    </>
  );
}
