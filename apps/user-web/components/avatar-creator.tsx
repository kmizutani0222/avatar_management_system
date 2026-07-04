'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { AvatarBodyType } from '@ams/shared-types';
import { resolvePartsFromSelections } from '@ams/avatar-viewer/resolve-parts';
import {
  ApiPart,
  CATEGORY_LABELS,
  defaultSelections,
  groupPartsByCategory,
} from '@/lib/avatars';

const AvatarPreview = dynamic(
  () => import('@ams/avatar-viewer/preview').then((m) => m.AvatarPreview),
  {
    ssr: false,
    loading: () => <div className="preview-loading">3D プレビュー読み込み中...</div>,
  },
);

interface AvatarCreatorProps {
  parts: ApiPart[];
  bodyType: AvatarBodyType;
  initialName?: string;
  initialSelections?: Record<string, string>;
  submitLabel: string;
  onSubmit: (data: { name: string; selections: Record<string, string> }) => Promise<void>;
  onCancel: () => void;
}

export function AvatarCreator({
  parts,
  bodyType,
  initialName = '',
  initialSelections,
  submitLabel,
  onSubmit,
  onCancel,
}: AvatarCreatorProps) {
  const [name, setName] = useState(initialName);
  const [selections, setSelections] = useState<Record<string, string>>(
    initialSelections ?? defaultSelections(parts),
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => groupPartsByCategory(parts), [parts]);

  const resolvedParts = useMemo(
    () => resolvePartsFromSelections(parts, selections),
    [parts, selections],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('アバター名を入力してください');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), selections });
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="creator-layout">
      <div className="creator-preview">
        <AvatarPreview bodyType={bodyType} parts={resolvedParts} className="preview-canvas" />
      </div>

      <div className="creator-form">
        <div className="card">
          <h2>基本設定</h2>
          <label className="field-label">
            アバター名
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="マイアバター"
              required
            />
          </label>
        </div>

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="card">
            <h2>{CATEGORY_LABELS[category] ?? category}</h2>
            <div className="part-options">
              {items.map((part) => (
                <label
                  key={part.id}
                  className={`part-option ${selections[category] === part.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={category}
                    value={part.id}
                    checked={selections[category] === part.id}
                    onChange={() =>
                      setSelections((prev) => ({ ...prev, [category]: part.id }))
                    }
                  />
                  <span>{part.name}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="form-error">{error}</p>}

        <div className="creator-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            キャンセル
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? '保存中...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
