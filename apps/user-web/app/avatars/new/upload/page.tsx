'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequireAuth, useAuth } from '@ams/web-auth';
import { AvatarBodyType } from '@ams/shared-types';
import { uploadVrmAvatar } from '@/lib/avatars';

const VrmPreview = dynamic(
  () => import('@ams/avatar-viewer/vrm-preview').then((m) => m.VrmPreview),
  { ssr: false, loading: () => <div className="preview-loading">VRM 読み込み中...</div> },
);

function VrmUploadContent() {
  const { token } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const fileLabel = useMemo(() => file?.name ?? '未選択', [file]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !file) {
      setError('VRM ファイルを選択してください');
      return;
    }
    if (!name.trim()) {
      setError('アバター名を入力してください');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await uploadVrmAvatar(token, {
        name: name.trim(),
        bodyType: AvatarBodyType.HUMANOID_VRM,
        sourceType: 'vrm_upload',
        file,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>VRM アップロード</h1>
          <p className="subtitle">humanoid_vrm · 最大 80MB</p>
        </div>
        <Link href="/avatars/new" className="btn-secondary">
          戻る
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="creator-layout">
        <div className="creator-preview">
          {previewUrl ? (
            <VrmPreview url={previewUrl} className="preview-canvas" />
          ) : (
            <div className="preview-loading">VRM ファイルを選択するとプレビューが表示されます</div>
          )}
        </div>

        <div className="creator-form">
          <div className="card">
            <h2>ファイル</h2>
            <label className="field-label">
              .vrm ファイル
              <input
                type="file"
                accept=".vrm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </label>
            <p className="hint">選択中: {fileLabel}</p>
            <p className="hint">アップロード後は内容の編集不可。変更時は再アップロードしてください。</p>
          </div>

          <div className="card">
            <label className="field-label">
              アバター名
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My VRM Avatar"
                required
              />
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="creator-actions">
            <Link href="/dashboard" className="btn-secondary">
              キャンセル
            </Link>
            <button type="submit" className="btn-primary" disabled={saving || !file}>
              {saving ? 'アップロード中...' : 'アバターを作成'}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

export default function VrmUploadPage() {
  return (
    <RequireAuth>
      <VrmUploadContent />
    </RequireAuth>
  );
}
