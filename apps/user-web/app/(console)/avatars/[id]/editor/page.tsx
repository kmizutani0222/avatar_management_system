'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@ams/web-auth';
import { VrmEditorMetadata } from '@ams/shared-types';
import { fetchAvatar, getAvatarModelUrl, updateAvatar } from '@/lib/avatars';

const VrmPreview = dynamic(
  () => import('@ams/avatar-viewer/vrm-preview').then((m) => m.VrmPreview),
  { ssr: false, loading: () => <div className="preview-loading">読み込み中...</div> },
);

function EditorEditContent() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [name, setName] = useState('');
  const [blendShapes, setBlendShapes] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const modelUrl = getAvatarModelUrl(id);
  const authHeader = token ? `Bearer ${token}` : undefined;
  const editorMetadata: VrmEditorMetadata = { blendShapes };

  useEffect(() => {
    if (!token) return;
    fetchAvatar(token, id)
      .then((avatar) => {
        if (avatar.sourceType !== 'vrm_editor') {
          setError('VRM エディタ形式のアバターのみ編集できます');
          return;
        }
        setName(avatar.name);
        setBlendShapes(avatar.editorMetadata?.blendShapes ?? {});
      })
      .catch(() => setError('読み込みに失敗しました'))
      .finally(() => setLoading(false));
  }, [token, id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await updateAvatar(token, id, {
        name: name.trim(),
        editorMetadata: { blendShapes },
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <><p className="loading-text">読み込み中...</p></>;
  if (error && !name) return <><p className="form-error">{error}</p></>;

  const expressionNames = Object.keys(blendShapes);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>VRM エディタ</h1>
          <p className="subtitle">表情設定を編集</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="creator-layout">
        <div className="creator-preview">
          <VrmPreview
            url={modelUrl}
            authHeader={authHeader}
            editorMetadata={editorMetadata}
            className="preview-canvas"
          />
        </div>

        <div className="creator-form">
          <div className="card">
            <label className="field-label">
              アバター名
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          </div>

          {expressionNames.length > 0 ? (
            <div className="card">
              <h2>表情（BlendShape）</h2>
              {expressionNames.map((expr) => (
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
          ) : (
            <p className="hint">保存済みの BlendShape 設定がありません。</p>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="creator-actions">
            <Link href="/dashboard" className="btn-secondary">キャンセル</Link>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? '保存中...' : '変更を保存'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

export default function EditorEditPage() {
  return <EditorEditContent />;
}
