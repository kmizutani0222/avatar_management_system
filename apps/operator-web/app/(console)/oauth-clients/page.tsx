'use client';

import Link from 'next/link';
import { PageHeader } from '@ams/admin-ui';
import { useEffect, useState } from 'react';
import { useAuth } from '@ams/web-auth';
import type { OAuthClientCreated, OAuthClientSummary } from '@ams/shared-types';
import {
  createOAuthClient,
  deactivateOAuthClient,
  fetchOAuthClients,
  updateOAuthClientRedirectUris,
} from '@/lib/operator-api';

const DEFAULT_REDIRECT_URI = 'http://localhost:4002/oauth/callback';

type ModalMode = 'create' | 'edit' | 'created';

function emptyRedirectRow() {
  return { id: crypto.randomUUID(), value: '' };
}

function urisToRows(uris: string[]) {
  if (uris.length === 0) {
    return [{ id: crypto.randomUUID(), value: DEFAULT_REDIRECT_URI }];
  }
  return uris.map((value) => ({ id: crypto.randomUUID(), value }));
}

export default function OAuthClientsPage() {
  const { token, profile } = useAuth();
  const [clients, setClients] = useState<OAuthClientSummary[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingClient, setEditingClient] = useState<OAuthClientSummary | null>(null);
  const [name, setName] = useState('');
  const [redirectRows, setRedirectRows] = useState([{ id: crypto.randomUUID(), value: DEFAULT_REDIRECT_URI }]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [created, setCreated] = useState<OAuthClientCreated | null>(null);

  const isActive = profile?.status === 'active';

  function reload() {
    if (!token) return;
    setLoading(true);
    fetchOAuthClients(token)
      .then(setClients)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [token]);

  function openCreateModal() {
    setModalMode('create');
    setEditingClient(null);
    setName('');
    setRedirectRows([{ id: crypto.randomUUID(), value: DEFAULT_REDIRECT_URI }]);
    setModalError('');
    setCreated(null);
    setModalOpen(true);
  }

  function openEditModal(client: OAuthClientSummary) {
    setModalMode('edit');
    setEditingClient(client);
    setRedirectRows(urisToRows(client.redirectUris));
    setModalError('');
    setCreated(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalError('');
    setCreated(null);
    setEditingClient(null);
    setSubmitting(false);
  }

  function addRedirectRow() {
    setRedirectRows((rows) => [...rows, emptyRedirectRow()]);
  }

  function updateRedirectRow(id: string, value: string) {
    setRedirectRows((rows) => rows.map((row) => (row.id === id ? { ...row, value } : row)));
  }

  function removeRedirectRow(id: string) {
    setRedirectRows((rows) => (rows.length <= 1 ? rows : rows.filter((row) => row.id !== id)));
  }

  function collectRedirectUris() {
    return redirectRows.map((row) => row.value.trim()).filter(Boolean);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !name.trim()) return;

    const redirectUris = collectRedirectUris();
    if (redirectUris.length === 0) {
      setModalError('redirect URI を1件以上入力してください');
      return;
    }

    setSubmitting(true);
    setModalError('');
    try {
      const result = await createOAuthClient(token, name.trim(), redirectUris);
      setCreated(result);
      setModalMode('created');
      reload();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : '作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !editingClient) return;

    const redirectUris = collectRedirectUris();
    if (redirectUris.length === 0) {
      setModalError('redirect URI を1件以上入力してください');
      return;
    }

    setSubmitting(true);
    setModalError('');
    try {
      await updateOAuthClientRedirectUris(token, editingClient.id, redirectUris);
      closeModal();
      reload();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : '更新に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!token || !confirm('この OAuth クライアントを無効化しますか？')) return;
    await deactivateOAuthClient(token, id);
    reload();
  }

  const modalTitle =
    modalMode === 'created'
      ? 'OAuth クライアントを作成しました'
      : modalMode === 'edit'
        ? 'redirect URI を編集'
        : 'OAuth クライアントを追加';

  return (
    <>
      <PageHeader
        title="OAuth クライアント"
        subtitle="ユーザー認可フロー用"
        actions={
          isActive ? (
            <button type="button" className="btn-primary" onClick={openCreateModal}>
              新規追加
            </button>
          ) : undefined
        }
      />

      {!isActive && (
        <p className="form-error">管理者の承認後に OAuth クライアントを作成できます。</p>
      )}

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p className="loading-text">読み込み中...</p>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>名前</th>
                <th>client_id</th>
                <th>redirect URI</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td><code>{client.clientId}</code></td>
                  <td>
                    {client.redirectUris.length > 0 ? (
                      <code>{client.redirectUris.join(', ')}</code>
                    ) : (
                      <span className="hint">未設定</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${client.isActive ? 'status-active' : 'status-inactive'}`}>
                      {client.isActive ? '有効' : '無効'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {client.isActive && isActive && (
                        <>
                          <button type="button" className="btn-secondary btn-sm" onClick={() => openEditModal(client)}>
                            編集
                          </button>
                          <button type="button" className="btn-danger btn-sm" onClick={() => handleDeactivate(client.id)}>
                            無効化
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && <p className="hint">OAuth クライアントがありません</p>}
        </div>
      )}

      {modalOpen && (
        <div className="ams-modal-overlay" onClick={closeModal} role="presentation">
          <div
            className="ams-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="oauth-client-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ams-modal-header">
              <h2 id="oauth-client-modal-title">{modalTitle}</h2>
              <button type="button" className="ams-modal-close" onClick={closeModal} aria-label="閉じる">
                ×
              </button>
            </div>

            {modalMode === 'created' && created ? (
              <div className="ams-modal-body">
                <p className="hint">client_secret は再表示できません。必ず安全な場所に保存してください。</p>
                <div className="secret-box">
                  <p><strong>client_id:</strong> {created.clientId}</p>
                  <p><strong>client_secret:</strong> {created.clientSecret}</p>
                  <p><strong>redirect URIs:</strong> {created.redirectUris.join(', ')}</p>
                </div>
                <div className="ams-modal-actions">
                  <button type="button" className="btn-primary" onClick={closeModal}>
                    閉じる
                  </button>
                </div>
              </div>
            ) : modalMode === 'edit' && editingClient ? (
              <form className="ams-modal-body" onSubmit={handleUpdate}>
                <div className="oauth-client-readonly">
                  <p><strong>アプリ名:</strong> {editingClient.name}</p>
                  <p><strong>client_id:</strong> <code>{editingClient.clientId}</code></p>
                </div>

                <div className="redirect-uri-list">
                  <span className="field-label">redirect URI</span>
                  {redirectRows.map((row, index) => (
                    <div key={row.id} className="redirect-uri-row">
                      <input
                        type="url"
                        value={row.value}
                        onChange={(e) => updateRedirectRow(row.id, e.target.value)}
                        placeholder="http://localhost:4002/oauth/callback"
                        required={index === 0}
                      />
                      {redirectRows.length > 1 && (
                        <button
                          type="button"
                          className="btn-danger btn-sm"
                          onClick={() => removeRedirectRow(row.id)}
                          aria-label="行を削除"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="redirect-uri-add-btn"
                    onClick={addRedirectRow}
                    aria-label="redirect URI を追加"
                  >
                    +
                  </button>
                </div>

                {modalError && <p className="form-error">{modalError}</p>}

                <div className="ams-modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeModal} disabled={submitting}>
                    キャンセル
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? '保存中…' : '保存'}
                  </button>
                </div>
              </form>
            ) : (
              <form className="ams-modal-body" onSubmit={handleCreate}>
                <label className="field-label-wide">
                  アプリ名
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My App"
                    required
                    autoFocus
                  />
                </label>

                <div className="redirect-uri-list">
                  <span className="field-label">redirect URI</span>
                  {redirectRows.map((row, index) => (
                    <div key={row.id} className="redirect-uri-row">
                      <input
                        type="url"
                        value={row.value}
                        onChange={(e) => updateRedirectRow(row.id, e.target.value)}
                        placeholder="http://localhost:4002/oauth/callback"
                        required={index === 0}
                      />
                      {redirectRows.length > 1 && (
                        <button
                          type="button"
                          className="btn-danger btn-sm"
                          onClick={() => removeRedirectRow(row.id)}
                          aria-label="行を削除"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="redirect-uri-add-btn"
                    onClick={addRedirectRow}
                    aria-label="redirect URI を追加"
                  >
                    +
                  </button>
                </div>

                {modalError && <p className="form-error">{modalError}</p>}

                <div className="ams-modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeModal} disabled={submitting}>
                    キャンセル
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? '作成中…' : '作成'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <h2>OAuth 連携の流れ</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>担当</th>
              <th>内容</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ユーザー</td>
              <td>外部サイトから AMS ログイン → あなたのアプリへの連携を許可</td>
            </tr>
            <tr>
              <td>運営者（サーバー）</td>
              <td>認可 code を access_token に交換（client_secret はサーバーのみ）</td>
            </tr>
            <tr>
              <td>運営者（SDK）</td>
              <td>access_token を <code>AmsClient</code> に渡してアバターを取得</td>
            </tr>
          </tbody>
        </table>
        <p className="hint">
          ステップごとの試行は <Link href="/sandbox">SDK サンドボックス</Link> を参照してください。
        </p>
      </div>
    </>
  );
}
