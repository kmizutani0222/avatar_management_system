'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireAuth, useAuth } from '@ams/web-auth';
import { AvatarBodyType } from '@ams/shared-types';
import {
  AdminPart,
  createAdminPart,
  deleteAdminPart,
  fetchAdminParts,
  updateAdminPart,
  uploadAdminPartAsset,
} from '@/lib/admin-api';
import type { PartMetadata } from '@ams/shared-types';

function PartsContent() {
  const { token } = useAuth();
  const [parts, setParts] = useState<AdminPart[]>([]);
  const [filter, setFilter] = useState<AvatarBodyType | ''>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [newPart, setNewPart] = useState({
    bodyType: AvatarBodyType.HUMANOID_VRM,
    category: '',
    name: '',
  });

  function reload() {
    if (!token) return;
    setLoading(true);
    fetchAdminParts(token, filter || undefined)
      .then(setParts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [token, filter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      await createAdminPart(token, newPart);
      setNewPart({ bodyType: AvatarBodyType.HUMANOID_VRM, category: '', name: '' });
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '作成に失敗しました');
    }
  }

  async function toggleActive(part: AdminPart) {
    if (!token) return;
    await updateAdminPart(token, part.id, { isActive: !part.isActive });
    reload();
  }

  async function handleDelete(id: string) {
    if (!token || !confirm('このパーツを削除しますか？')) return;
    await deleteAdminPart(token, id);
    reload();
  }

  async function handleAssetUpload(partId: string, file: File) {
    if (!token) return;
    setError('');
    try {
      await uploadAdminPartAsset(token, partId, file);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'GLB アップロードに失敗しました');
    }
  }

  function hasGlbAsset(part: AdminPart): boolean {
    const meta = part.metadata as PartMetadata | null;
    return Boolean(meta?.bake?.assetKey);
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>パーツ管理</h1>
          <p className="subtitle">humanoid_vrm / biped_mascot</p>
        </div>
        <Link href="/dashboard" className="btn-secondary">ダッシュボード</Link>
      </header>

      <div className="card">
        <h2>新規パーツ</h2>
        <form onSubmit={handleCreate} className="field-row">
          <label>
            body_type
            <select
              value={newPart.bodyType}
              onChange={(e) => setNewPart((p) => ({ ...p, bodyType: e.target.value as AvatarBodyType }))}
            >
              <option value={AvatarBodyType.HUMANOID_VRM}>humanoid_vrm</option>
              <option value={AvatarBodyType.BIPED_MASCOT}>biped_mascot</option>
            </select>
          </label>
          <label>
            カテゴリ
            <input
              value={newPart.category}
              onChange={(e) => setNewPart((p) => ({ ...p, category: e.target.value }))}
              required
            />
          </label>
          <label>
            名前
            <input
              value={newPart.name}
              onChange={(e) => setNewPart((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </label>
          <button type="submit" className="btn-primary">追加</button>
        </form>
      </div>

      <div className="card">
        <div className="field-row">
          <label>
            フィルタ
            <select value={filter} onChange={(e) => setFilter(e.target.value as AvatarBodyType | '')}>
              <option value="">すべて</option>
              <option value={AvatarBodyType.HUMANOID_VRM}>humanoid_vrm</option>
              <option value={AvatarBodyType.BIPED_MASCOT}>biped_mascot</option>
            </select>
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p className="loading-text">読み込み中...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>body_type</th>
                <th>カテゴリ</th>
                <th>名前</th>
                <th>GLB</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => (
                <tr key={part.id}>
                  <td>{part.bodyType}</td>
                  <td>{part.category}</td>
                  <td>{part.name}</td>
                  <td>
                    {hasGlbAsset(part) ? (
                      <span className="status-badge status-active">登録済</span>
                    ) : (
                      <span className="status-badge status-inactive">未登録</span>
                    )}
                    <label className="file-upload-inline">
                      <input
                        type="file"
                        accept=".glb,model/gltf-binary"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleAssetUpload(part.id, file);
                          e.target.value = '';
                        }}
                      />
                      <span className="btn-secondary btn-sm">GLB アップロード</span>
                    </label>
                  </td>
                  <td>
                    <span className={`status-badge ${part.isActive ? 'status-active' : 'status-inactive'}`}>
                      {part.isActive ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button type="button" className="btn-secondary btn-sm" onClick={() => toggleActive(part)}>
                      {part.isActive ? '無効化' : '有効化'}
                    </button>
                    <button type="button" className="btn-danger" onClick={() => handleDelete(part.id)}>
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

export default function PartsPage() {
  return (
    <RequireAuth>
      <PartsContent />
    </RequireAuth>
  );
}
