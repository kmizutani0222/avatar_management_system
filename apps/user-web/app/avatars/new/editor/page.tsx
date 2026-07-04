'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequireAuth, useAuth } from '@ams/web-auth';
import { AvatarBodyType, VrmEditorMetadata } from '@ams/shared-types';
import { extractVrmExpressionNames } from '@ams/avatar-viewer/vrm-preview';
import { uploadVrmAvatar } from '@/lib/avatars';

const VrmPreview = dynamic(
  () => import('@ams/avatar-viewer/vrm-preview').then((m) => m.VrmPreview),
  { ssr: false, loading: () => <div className="preview-loading">VRM 読み込み中...</div> },
);

function VrmEditorCreateContent() {
  const { token } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [expressions, setExpressions] = useState<string[]>([]);
  const [blendShapes, setBlendShapes] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setExpressions([]);
      setBlendShapes({});
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    extractVrmExpressionNames(file)
      .then((names) => {
        setExpressions(names);
        const initial: Record<string, number> = {};
        for (const n of names) initial[n] = 0;
        setBlendShapes(initial);
      })
      .catch(() => setExpressions([]));

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const editorMetadata: VrmEditorMetadata = { blendShapes };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !file) return;
    setSaving(true);
    setError('');
    try {
      const avatar = await uploadVrmAvatar(token, {
        name: name.trim(),
        bodyType: AvatarBodyType.HUMANOID_VRM,
        sourceType: 'vrm_editor',
        file,
      });
      // Save blend shape settings after create
      const { updateAvatar } = await import('@/lib/avatars');
      await updateAvatar(token, avatar.id, { editorMetadata });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>VRM エディタ</h1>
          <p className="subtitle">表情（BlendShape）を調整して作成</p>
        </div>
        <Link href="/avatars/new" className="btn-secondary">
          戻る
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="creator-layout">
        <div className="creator-preview">
          {previewUrl ? (
            <VrmPreview url={previewUrl} editorMetadata={editorMetadata} className="preview-canvas" />
          ) : (
            <div className="preview-loading">VRM を選択してください</div>
          )}
        </div>

        <div className="creator-form">
          <div className="card">
            <h2>VRM ファイル</h2>
            <label className="field-label">
              .vrm
              <input
                type="file"
                accept=".vrm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </label>
          </div>

          <div className="card">
            <label className="field-label">
              アバター名
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          </div>

          {expressions.length > 0 && (
            <div className="card">
              <h2>表情（BlendShape）</h2>
              {expressions.map((expr) => (
                <label key={expr} className="slider-label">
                  {expr}
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={blendShapes[expr] ?? 0}
                    onChange={(e) =>
                      setBlendShapes((prev) => ({ ...prev, [expr]: parseFloat(e.target.value) }))
                    }
                  />
                  <span className="slider-value">{(blendShapes[expr] ?? 0).toFixed(2)}</span>
                </label>
              ))}
            </div>
          )}

          {expressions.length === 0 && file && (
            <p className="hint">この VRM には BlendShape（表情）が含まれていません。</p>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="creator-actions">
            <Link href="/dashboard" className="btn-secondary">
              キャンセル
            </Link>
            <button type="submit" className="btn-primary" disabled={saving || !file || !name.trim()}>
              {saving ? '保存中...' : 'アバターを作成'}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

export default function VrmEditorCreatePage() {
  return (
    <RequireAuth>
      <VrmEditorCreateContent />
    </RequireAuth>
  );
}
