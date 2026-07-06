'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PageHeader } from '@ams/admin-ui';
import { useAuth } from '@ams/web-auth';
import { CopyButton } from '@/components/copy-button';
import { ExternalIntegrationModal } from '@/components/external-integration-modal';
import { getApiUrl } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';
import { AvatarBodyType } from '@ams/shared-types';
import { resolvePartsFromSelections } from '@ams/avatar-viewer/resolve-parts';
import {
  ApiAvatar,
  BODY_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
  deleteAvatar,
  fetchAvatars,
  getAvatarModelUrl,
  getAvatarThumbnailUrl,
  getBaseTemplateUrl,
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

function AvatarThumbnail({
  avatarId,
  cacheKey,
  token,
  alt,
  className,
}: {
  avatarId: string;
  cacheKey: string;
  token: string;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    fetch(getAvatarThumbnailUrl(avatarId, cacheKey), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(null));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [avatarId, cacheKey, token]);

  if (!url) {
    return <div className={`preview-loading-sm ${className ?? ''}`.trim()}>...</div>;
  }

  return <img src={url} alt={alt} className={className} />;
}

function AvatarCard({
  avatar,
  partsCatalog,
  authHeader,
  token,
  onDelete,
  onToggleExternal,
}: {
  avatar: ApiAvatar;
  partsCatalog: Array<{ id: string; category: string; name: string; metadata?: unknown }>;
  authHeader: string;
  token: string;
  onDelete: () => void;
  onToggleExternal: () => void;
}) {
  const resolved = avatar.partsConfig?.selections
    ? resolvePartsFromSelections(partsCatalog, avatar.partsConfig.selections)
    : [];

  const isVrm = avatar.sourceType === 'vrm_upload' || avatar.sourceType === 'vrm_editor';
  const previewKey = avatar.updatedAt;
  const useVrmPreview = isVrm && Boolean(avatar.modelUrl);
  const useThumbnail = Boolean(avatar.thumbnailUrl) && !useVrmPreview;

  return (
    <div className="avatar-card">
      <div className="avatar-card-preview">
        {useThumbnail ? (
          <AvatarThumbnail
            avatarId={avatar.id}
            cacheKey={previewKey}
            token={token}
            alt={avatar.name}
            className="avatar-card-canvas avatar-card-thumbnail"
          />
        ) : avatar.sourceType === 'parts' && resolved.length > 0 ? (
          <AvatarPreview
            key={`${avatar.id}-${previewKey}`}
            bodyType={avatar.bodyType as AvatarBodyType}
            parts={resolved}
            className="avatar-card-canvas"
            showControlsHint={false}
            baseTemplateUrl={getBaseTemplateUrl(avatar.bodyType as AvatarBodyType)}
          />
        ) : useVrmPreview ? (
          <VrmPreview
            key={`${avatar.id}-${previewKey}`}
            url={getAvatarModelUrl(avatar.id, previewKey)}
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
        <p className="avatar-meta avatar-id-row">
          ID: <code>{avatar.id}</code>
          <CopyButton value={avatar.id} />
        </p>
        {avatar.externalEnabled && (
          <p className="avatar-external-badge">外部サイトで利用可能</p>
        )}
        <div className="avatar-card-actions">
          {avatar.sourceType === 'parts' && (
            <Link href={`/avatars/${avatar.id}/edit`} className="btn-secondary btn-sm">
              着せ替え
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
          {avatar.bodyType === 'humanoid_vrm' && avatar.modelUrl && (
            <Link href={`/avatars/${avatar.id}/expressions`} className="btn-secondary btn-sm">
              表情設定
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
  const { token } = useAuth();
  const [externalHelpOpen, setExternalHelpOpen] = useState(false);
  const [avatars, setAvatars] = useState<ApiAvatar[]>([]);
  const [partsCatalog, setPartsCatalog] = useState<
    Array<{ id: string; category: string; name: string; metadata?: unknown }>
  >([]);

  const authHeader = token ? `Bearer ${token}` : '';

  async function loadData() {
    if (!token) return;
    const [av, humanoid, mascot, quadruped] = await Promise.all([
      fetchAvatars(token),
      fetch(`${getApiUrl()}/api/parts?bodyType=humanoid_vrm`).then((r) => r.json()),
      fetch(`${getApiUrl()}/api/parts?bodyType=biped_mascot`).then((r) => r.json()),
      fetch(`${getApiUrl()}/api/parts?bodyType=quadruped`).then((r) => r.json()),
    ]);
    setAvatars(sortAvatars(av));
    setPartsCatalog([...humanoid, ...mascot, ...quadruped]);
  }

  /** 作成日順で固定（updatedAt 順だと外部連携トグルで並び替わり、WebGL プレビューが壊れる） */
  function sortAvatars(list: ApiAvatar[]) {
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  const displayAvatars = useMemo(() => sortAvatars(avatars), [avatars]);

  useEffect(() => {
    loadData().catch(() => setAvatars([]));
  }, [token]);

  async function handleDelete(id: string) {
    if (!token || !confirm('このアバターを削除しますか？')) return;
    await deleteAvatar(token, id);
    loadData();
  }

  async function handleToggleExternal(avatar: ApiAvatar) {
    if (!token) return;
    const next = !avatar.externalEnabled;
    setAvatars((prev) =>
      prev.map((a) => (a.id === avatar.id ? { ...a, externalEnabled: next } : a)),
    );
    try {
      await updateAvatar(token, avatar.id, { externalEnabled: next });
    } catch (err) {
      setAvatars((prev) =>
        prev.map((a) => (a.id === avatar.id ? { ...a, externalEnabled: !next } : a)),
      );
      alert(err instanceof Error ? err.message : '外部連携の更新に失敗しました');
    }
  }

  return (
    <>
      <PageHeader
        title="マイアバター"
        subtitle="作成したアバターの管理と外部連携"
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setExternalHelpOpen(true)}
            >
              外部連携について
            </button>
            <Link href="/avatars/new" className="btn-primary">
              + 新規作成
            </Link>
          </>
        }
      />

      <ExternalIntegrationModal
        open={externalHelpOpen}
        onClose={() => setExternalHelpOpen(false)}
      />

      <div className="card">
        <h2>マイアバター ({displayAvatars.length})</h2>
        {displayAvatars.length === 0 ? (
          <div className="empty-state">
            <p className="subtitle">アバターがまだありません</p>
            <Link href="/avatars/new" className="btn-primary">
              最初のアバターを作成
            </Link>
          </div>
        ) : (
          <div className="avatar-grid">
            {displayAvatars.map((avatar) => (
              <AvatarCard
                key={avatar.id}
                avatar={avatar}
                partsCatalog={partsCatalog}
                authHeader={authHeader}
                token={token ?? ''}
                onDelete={() => handleDelete(avatar.id)}
                onToggleExternal={() => handleToggleExternal(avatar)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
