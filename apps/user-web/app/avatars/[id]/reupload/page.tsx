'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { RequireAuth, useAuth } from '@ams/web-auth';
import { fetchAvatar, reuploadVrmAvatar } from '@/lib/avatars';

const VrmPreview = dynamic(
  () => import('@ams/avatar-viewer/vrm-preview').then((m) => m.VrmPreview),
  { ssr: false, loading: () => <div className="preview-loading">読み込み中...</div> },
);

function ReuploadContent() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [avatarName, setAvatarName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchAvatar(token, id)
      .then((a) => setAvatarName(a.name))
      .catch(() => setError('アバターが見つかりません'));
  }, [token, id]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !file) return;
    setSaving(true);
    try {
      await reuploadVrmAvatar(token, id, file);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '再アップロードに失敗しました');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <h1>VRM 再アップロード</h1>
      <p className="subtitle">{avatarName} — モデルファイルを差し替えます</p>

      <form onSubmit={handleSubmit} className="creator-layout">
        <div className="creator-preview">
          {previewUrl ? (
            <VrmPreview url={previewUrl} className="preview-canvas" />
          ) : (
            <div className="preview-loading">新しい VRM を選択してください</div>
          )}
        </div>

        <div className="creator-form">
          <div className="card">
            <label className="field-label">
              新しい .vrm ファイル
              <input
                type="file"
                accept=".vrm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="creator-actions">
            <Link href="/dashboard" className="btn-secondary">キャンセル</Link>
            <button type="submit" className="btn-primary" disabled={saving || !file}>
              {saving ? 'アップロード中...' : '差し替える'}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

export default function ReuploadPage() {
  return (
    <RequireAuth>
      <ReuploadContent />
    </RequireAuth>
  );
}
