'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { RequireAuth, useAuth } from '@ams/web-auth';
import type { ExpressionPresetMap } from '@ams/shared-types';
import { fetchAvatar, getAvatarModelUrl, updateAvatar, type ApiAvatar } from '@/lib/avatars';

const VrmPreview = dynamic(
  () => import('@ams/avatar-viewer/vrm-preview').then((m) => m.VrmPreview),
  { ssr: false, loading: () => <div className="preview-loading">読み込み中...</div> },
);

const SUGGESTED_PRESET_NAMES = ['笑顔', '悲しい', '楽しい', '怒り', '驚き'];

function ExpressionSettingsContent() {
  const { token } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [avatar, setAvatar] = useState<ApiAvatar | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [expressionNames, setExpressionNames] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, number>>({});
  const [presets, setPresets] = useState<ExpressionPresetMap>({});
  const [presetName, setPresetName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const loaded = await fetchAvatar(token, id);
        if (cancelled) return;
        setAvatar(loaded);
        setPresets(loaded.editorMetadata?.expressionPresets ?? {});

        const res = await fetch(getAvatarModelUrl(id, loaded.updatedAt), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('model fetch failed');
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setModelUrl(objectUrl);

        const { extractVrmExpressionNames } = await import('@ams/avatar-viewer/vrm-preview');
        const names = await extractVrmExpressionNames(new File([blob], 'model.vrm'));
        if (cancelled) return;

        const unique = Array.from(new Set(names.filter(Boolean))) as string[];
        setExpressionNames(unique);
        setValues(Object.fromEntries(unique.map((name) => [name, 0])));
      } catch {
        if (!cancelled) setError('モデルの読み込みに失敗しました');
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token, id]);

  const previewMetadata = useMemo(() => ({ blendShapes: values }), [values]);

  function handleValueChange(name: string, value: number) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setMessage('');
  }

  function resetValues() {
    setValues(Object.fromEntries(expressionNames.map((name) => [name, 0])));
  }

  function addPreset() {
    const name = presetName.trim();
    if (!name) {
      setError('プリセット名を入力してください');
      return;
    }
    const active = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value > 0),
    );
    if (Object.keys(active).length === 0) {
      setError('スライダーで表情を作ってから追加してください');
      return;
    }
    setError('');
    setMessage('');
    setPresets((prev) => ({ ...prev, [name]: active }));
    setPresetName('');
  }

  function applyPreset(name: string) {
    const preset = presets[name];
    if (!preset) return;
    setValues({
      ...Object.fromEntries(expressionNames.map((n) => [n, 0])),
      ...preset,
    });
  }

  function deletePreset(name: string) {
    setPresets((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setMessage('');
  }

  async function handleSave() {
    if (!token || !avatar) return;
    setSaving(true);
    setError('');
    try {
      await updateAvatar(token, id, {
        editorMetadata: {
          blendShapes: avatar.editorMetadata?.blendShapes ?? {},
          expressionPresets: presets,
        },
      });
      setMessage('保存しました。SDK デモで切り替えられます。');
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
          <h1>表情プリセット設定</h1>
          <p className="subtitle">
            {avatar?.name ?? '...'} — 表情の組み合わせに名前を付けて保存し、SDK から切り替えます
          </p>
        </div>
        <Link href="/dashboard" className="btn-secondary">
          ダッシュボード
        </Link>
      </header>

      <div className="creator-layout">
        <div className="creator-preview">
          {modelUrl ? (
            <VrmPreview
              url={modelUrl}
              editorMetadata={previewMetadata}
              className="preview-canvas"
            />
          ) : (
            <div className="preview-loading">{error || 'モデルを読み込み中...'}</div>
          )}
        </div>

        <div className="creator-form">
          <div className="card">
            <div className="sdk-demo-section-header">
              <h2>表情を作る</h2>
              <button type="button" className="btn-secondary btn-sm" onClick={resetValues}>
                リセット
              </button>
            </div>
            {expressionNames.length === 0 ? (
              <p className="hint">このモデルには表情（Expression）がありません。</p>
            ) : (
              expressionNames.map((name) => (
                <label key={name} className="slider-label">
                  {name}
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={values[name] ?? 0}
                    onChange={(e) => handleValueChange(name, Number(e.target.value))}
                  />
                  <span className="slider-value">{(values[name] ?? 0).toFixed(2)}</span>
                </label>
              ))
            )}
          </div>

          {expressionNames.length > 0 && (
            <div className="card">
              <h2>プリセットに追加</h2>
              <div className="sdk-demo-mode-buttons">
                {SUGGESTED_PRESET_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => setPresetName(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <label className="field-label">
                プリセット名
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="笑顔"
                />
              </label>
              <div className="creator-actions">
                <button type="button" className="btn-primary" onClick={addPreset}>
                  現在の表情を追加
                </button>
              </div>
            </div>
          )}

          <div className="card">
            <h2>保存済みプリセット ({Object.keys(presets).length})</h2>
            {Object.keys(presets).length === 0 ? (
              <p className="hint">まだプリセットがありません。</p>
            ) : (
              <div className="expression-preset-list">
                {Object.entries(presets).map(([name, preset]) => (
                  <div key={name} className="expression-preset-row">
                    <strong>{name}</strong>
                    <span className="hint">
                      {Object.entries(preset)
                        .map(([expr, value]) => `${expr}: ${value.toFixed(2)}`)
                        .join(', ')}
                    </span>
                    <div className="expression-preset-actions">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => applyPreset(name)}
                      >
                        適用
                      </button>
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => deletePreset(name)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="form-error">{error}</p>}
          {message && <p className="hint">{message}</p>}

          <div className="creator-actions">
            <Link href="/dashboard" className="btn-secondary">
              戻る
            </Link>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || !avatar}
            >
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ExpressionSettingsPage() {
  return (
    <RequireAuth>
      <ExpressionSettingsContent />
    </RequireAuth>
  );
}
