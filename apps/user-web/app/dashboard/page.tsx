'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { RequireAuth, useAuth } from '@ams/web-auth';
import { getApiUrl } from '@/lib/api';
import { useEffect, useState } from 'react';
import { AvatarBodyType } from '@ams/shared-types';
import { resolvePartsFromSelections } from '@ams/avatar-viewer/resolve-parts';
import {
  ApiAvatar,
  BODY_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
  deleteAvatar,
  fetchAvatars,
  getAvatarModelUrl,
  updateAvatar,
} from '@/lib/avatars';

const AvatarPreview = dynamic(
  () => import('@ams/avatar-viewer/preview').then((m) => m.AvatarPreview),
  { ssr: false, loading: () => <div className="preview-loading-sm">...</div> },
);

const VrmPreview = dynamic(
  () => import('@ams/avatar-viewer/vrm-preview').then((m) => m.VrmPreview),
  { ssr: false, loading: () => <div className="preview-loading-sm">...</div> },
);

function AvatarCard({
  avatar,
  partsCatalog,
  authHeader,
  onDelete,
  onToggleExternal,
}: {
  avatar: ApiAvatar;
  partsCatalog: Array<{ id: string; category: string; name: string; metadata?: unknown }>;
  authHeader: string;
  onDelete: () => void;
  onToggleExternal: () => void;
}) {
  const resolved = avatar.partsConfig?.selections
    ? resolvePartsFromSelections(partsCatalog, avatar.partsConfig.selections)
    : [];

  const isVrm = avatar.sourceType === 'vrm_upload' || avatar.sourceType === 'vrm_editor';

  return (
    <div className="avatar-card">
      <div className="avatar-card-preview">
        {avatar.sourceType === 'parts' && resolved.length > 0 ? (
          <AvatarPreview
            bodyType={avatar.bodyType as AvatarBodyType}
            parts={resolved}
            className="avatar-card-canvas"
            showControlsHint={false}
          />
        ) : isVrm && avatar.modelUrl ? (
          <VrmPreview
            url={getAvatarModelUrl(avatar.id)}
            authHeader={authHeader}
            editorMetadata={avatar.editorMetadata}
            className="avatar-card-canvas"
            showControlsHint={false}
          />
        ) : (
          <div className="preview-placeholder">No preview</div>
        )}
      </div>
      <div className="avatar-card-info">
        <h3>{avatar.name}</h3>
        <p className="subtitle">{BODY_TYPE_LABELS[avatar.bodyType as AvatarBodyType]}</p>
        <p className="avatar-meta">
          {SOURCE_TYPE_LABELS[avatar.sourceType] ?? avatar.sourceType} · {avatar.status}
        </p>
        <div className="avatar-card-actions">
          {avatar.sourceType === 'parts' && (
            <Link href={`/avatars/${avatar.id}/edit`} className="btn-secondary btn-sm">
              編集
            </Link>
          )}
          {avatar.sourceType === 'vrm_upload' && (
            <Link href={`/avatars/${avatar.id}/reupload`} className="btn-secondary btn-sm">
              再アップロード
            </Link>
          )}
          {avatar.sourceType === 'vrm_editor' && (
            <Link href={`/avatars/${avatar.id}/editor`} className="btn-secondary btn-sm">
              エディタ
            </Link>
          )}
          <button type="button" className="btn-secondary btn-sm" onClick={onToggleExternal}>
            外部連携: {avatar.externalEnabled ? 'ON' : 'OFF'}
          </button>
          <button type="button" className="btn-danger btn-sm" onClick={onDelete}>
            削除
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { profile, token, logout } = useAuth();
  const router = useRouter();
  const [avatars, setAvatars] = useState<ApiAvatar[]>([]);
  const [partsCatalog, setPartsCatalog] = useState<
    Array<{ id: string; category: string; name: string; metadata?: unknown }>
  >([]);

  const authHeader = token ? `Bearer ${token}` : '';

  async function loadData() {
    if (!token) return;
    const [av, humanoid, mascot] = await Promise.all([
      fetchAvatars(token),
      fetch(`${getApiUrl()}/api/parts?bodyType=humanoid_vrm`).then((r) => r.json()),
      fetch(`${getApiUrl()}/api/parts?bodyType=biped_mascot`).then((r) => r.json()),
    ]);
    setAvatars(av);
    setPartsCatalog([...humanoid, ...mascot]);
  }

  useEffect(() => {
    loadData().catch(() => setAvatars([]));
  }, [token]);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  async function handleDelete(id: string) {
    if (!token || !confirm('このアバターを削除しますか？')) return;
    await deleteAvatar(token, id);
    loadData();
  }

  async function handleToggleExternal(avatar: ApiAvatar) {
    if (!token) return;
    await updateAvatar(token, avatar.id, { externalEnabled: !avatar.externalEnabled });
    loadData();
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <span className="badge badge-user">User :4001</span>
          <h1>マイアバター</h1>
        </div>
        <div className="header-actions">
          <Link href="/avatars/new" className="btn-primary">
            + 新規作成
          </Link>
          <button type="button" className="btn-secondary" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </header>

      <div className="card">
        <h2>アカウント</h2>
        <dl className="profile-dl">
          <dt>表示名</dt>
          <dd>{profile?.displayName ?? '—'}</dd>
          <dt>メール</dt>
          <dd>{profile?.email}</dd>
        </dl>
      </div>

      <div className="card">
        <h2>マイアバター ({avatars.length})</h2>
        {avatars.length === 0 ? (
          <div className="empty-state">
            <p className="subtitle">アバターがまだありません</p>
            <Link href="/avatars/new" className="btn-primary">
              最初のアバターを作成
            </Link>
          </div>
        ) : (
          <div className="avatar-grid">
            {avatars.map((avatar) => (
              <AvatarCard
                key={avatar.id}
                avatar={avatar}
                partsCatalog={partsCatalog}
                authHeader={authHeader}
                onDelete={() => handleDelete(avatar.id)}
                onToggleExternal={() => handleToggleExternal(avatar)}
              />
            ))}
          </div>
        )}
      </div>

      <p className="footer-link">
        <Link href="/">トップに戻る</Link>
      </p>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
