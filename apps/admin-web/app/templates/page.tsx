'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireAuth, useAuth } from '@ams/web-auth';
import {
  fetchTemplateStatus,
  resetBaseTemplate,
  TemplateStatus,
  uploadBaseTemplate,
} from '@/lib/admin-api';

const BODY_TYPE_LABELS: Record<string, string> = {
  humanoid_vrm: '人型（VRM）',
  biped_mascot: '二足マスコット',
  quadruped: '四足動物',
};

function TemplatesContent() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<TemplateStatus[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function reload() {
    if (!token) return;
    setLoading(true);
    fetchTemplateStatus(token)
      .then(setTemplates)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [token]);

  async function handleUpload(bodyType: string, file: File) {
    if (!token) return;
    setError('');
    try {
      await uploadBaseTemplate(token, bodyType, file);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'アップロードに失敗しました');
    }
  }

  async function handleReset(bodyType: string) {
    if (!token || !confirm(`${bodyType} のカスタムテンプレートを削除し、プロシージャル生成に戻しますか？`)) {
      return;
    }
    setError('');
    try {
      await resetBaseTemplate(token, bodyType);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'リセットに失敗しました');
    }
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>ベーステンプレート</h1>
          <p className="subtitle">body_type ごとの GLB ベースボディ（パーツ合成の土台）</p>
        </div>
        <Link href="/dashboard" className="btn-secondary">ダッシュボード</Link>
      </header>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="loading-text">読み込み中...</p>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>body_type</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((item) => (
                <tr key={item.bodyType}>
                  <td>
                    <strong>{BODY_TYPE_LABELS[item.bodyType] ?? item.bodyType}</strong>
                    <br />
                    <code>{item.bodyType}</code>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${item.isCustomUpload ? 'status-active' : 'status-inactive'}`}
                    >
                      {item.isCustomUpload ? 'カスタム GLB' : 'プロシージャル'}
                    </span>
                  </td>
                  <td className="table-actions">
                    <label className="file-upload-inline">
                      <input
                        type="file"
                        accept=".glb,model/gltf-binary"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleUpload(item.bodyType, file);
                          e.target.value = '';
                        }}
                      />
                      <span className="btn-secondary btn-sm">GLB アップロード</span>
                    </label>
                    {item.isCustomUpload && (
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => handleReset(item.bodyType)}
                      >
                        プロシージャルに戻す
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="form-hint">
            humanoid_vrm は VRM ボーン名付き GLB を推奨します。表情設定変更後は「プロシージャルに戻す」で再生成してください。
          </p>
        </div>
      )}
    </main>
  );
}

export default function TemplatesPage() {
  return (
    <RequireAuth>
      <TemplatesContent />
    </RequireAuth>
  );
}
