'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { PageHeader } from '@ams/admin-ui';
import { useAuth } from '@ams/web-auth';
import {
  DEFAULT_EXPRESSION_MORPH_SETTINGS,
  VRM_EXPRESSION_PRESETS,
  type ExpressionMorphSettings,
  type VrmExpressionPreset,
} from '@ams/shared-types';
import { fetchExpressionSettings, updateExpressionSettings } from '@/lib/admin-api';

const ExpressionPreview = dynamic(() => import('@/components/expression-preview'), {
  ssr: false,
  loading: () => <div className="preview-loading">3D プレビュー読み込み中...</div>,
});

const EXPRESSION_LABELS: Record<VrmExpressionPreset, string> = {
  happy: '喜び',
  angry: '怒り',
  sad: '悲しみ',
  relaxed: 'リラックス',
  surprised: '驚き',
  aa: '「あ」',
  ih: '「い」',
  ou: '「う」',
  ee: '「え」',
  oh: '「お」',
  blink: 'まばたき',
  blinkLeft: '左まばたき',
  blinkRight: '右まばたき',
};

const REGION_LABELS = {
  mouthScale: '口（happy / aa / oh など）',
  eyeScale: '目（blink / surprised など）',
  browScale: '眉（angry / relaxed など）',
} as const;

function intensityOf(settings: ExpressionMorphSettings, name: VrmExpressionPreset): number {
  return settings.expressionIntensity?.[name] ?? 1;
}

export default function ExpressionSettingsPage() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<ExpressionMorphSettings>(
    DEFAULT_EXPRESSION_MORPH_SETTINGS,
  );
  const [activeExpression, setActiveExpression] = useState<VrmExpressionPreset>('happy');
  const [previewWeight, setPreviewWeight] = useState(1);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchExpressionSettings(token)
      .then((data) => setSettings({ ...DEFAULT_EXPRESSION_MORPH_SETTINGS, ...data }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  function setRegionScale(key: keyof typeof REGION_LABELS, value: number) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function setIntensity(name: VrmExpressionPreset, value: number) {
    setSettings((prev) => ({
      ...prev,
      expressionIntensity: { ...prev.expressionIntensity, [name]: value },
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError('');
    setSaved('');
    try {
      const next = await updateExpressionSettings(token, settings);
      setSettings({ ...DEFAULT_EXPRESSION_MORPH_SETTINGS, ...next });
      setSaved('保存しました。ベーステンプレートを再生成したので、次回のベイク（アバター保存）から反映されます。');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="loading-text">読み込み中...</p>;
  }

  return (
    <>
      <PageHeader
        title="表情モーフ設定"
        subtitle="humanoid_vrm パーツアバターのプロシージャル表情を調整"
      />

      <div className="card">
        <h2>ライブプレビュー</h2>
        <ExpressionPreview
          settings={settings}
          activeExpression={activeExpression}
          weight={previewWeight}
        />
        <div className="field-row" style={{ marginTop: 12 }}>
          <label>
            プレビュー表情
            <select
              value={activeExpression}
              onChange={(e) => setActiveExpression(e.target.value as VrmExpressionPreset)}
            >
              {VRM_EXPRESSION_PRESETS.map((name) => (
                <option key={name} value={name}>
                  {EXPRESSION_LABELS[name]}（{name}）
                </option>
              ))}
            </select>
          </label>
          <label>
            表情の強さ {previewWeight.toFixed(2)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={previewWeight}
              onChange={(e) => setPreviewWeight(Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="card">
          <h2>部位スケール</h2>
          <p className="form-hint">口・目・眉ごとのモーフ変位倍率（0.1〜2.0）。全表情に共通で掛かります。</p>
          {(Object.keys(REGION_LABELS) as Array<keyof typeof REGION_LABELS>).map((key) => (
            <label key={key} className="field-block">
              {REGION_LABELS[key]}
              <input
                type="range"
                min={0.1}
                max={2}
                step={0.05}
                value={settings[key]}
                onChange={(e) => setRegionScale(key, Number(e.target.value))}
              />
              <span>{settings[key].toFixed(2)}</span>
            </label>
          ))}
        </div>

        <div className="card">
          <h2>表情ごとの強度</h2>
          <p className="form-hint">
            各 VRM プリセット表情の変位倍率（0〜2.0）。0 にするとその表情は動かなくなります。
            行をクリックするとプレビュー表情が切り替わります。
          </p>
          {VRM_EXPRESSION_PRESETS.map((name) => (
            <label
              key={name}
              className="field-block"
              onClick={() => setActiveExpression(name)}
              style={{
                cursor: 'pointer',
                background: activeExpression === name ? 'rgba(99, 102, 241, 0.12)' : undefined,
                borderRadius: 6,
                padding: '4px 8px',
              }}
            >
              {EXPRESSION_LABELS[name]}（{name}）
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={intensityOf(settings, name)}
                onChange={(e) => setIntensity(name, Number(e.target.value))}
              />
              <span>{intensityOf(settings, name).toFixed(2)}</span>
            </label>
          ))}
        </div>

        {error && <p className="form-error">{error}</p>}
        {saved && <p className="form-success">{saved}</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? '保存中...' : '保存してテンプレート再生成'}
        </button>
        <p className="form-hint">
          既存アバターへは、ユーザーが編集画面で保存し直す（再ベイク）と反映されます。
        </p>
      </form>
    </>
  );
}
