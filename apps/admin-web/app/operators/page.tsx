'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireAuth, useAuth } from '@ams/web-auth';
import { AdminOperator, fetchAdminOperators, updateAdminOperator } from '@/lib/admin-api';

function OperatorsContent() {
  const { token } = useAuth();
  const [operators, setOperators] = useState<AdminOperator[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function reload() {
    if (!token) return;
    setLoading(true);
    fetchAdminOperators(token)
      .then(setOperators)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [token]);

  async function setStatus(id: string, status: 'pending' | 'active' | 'suspended') {
    if (!token) return;
    try {
      await updateAdminOperator(token, id, status);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新に失敗しました');
    }
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>運営者管理</h1>
          <p className="subtitle">承認・停止</p>
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
                <th>会社名</th>
                <th>メール</th>
                <th>ステータス</th>
                <th>APIキー</th>
                <th>OAuth</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((op) => (
                <tr key={op.id}>
                  <td>{op.companyName}</td>
                  <td>{op.email}</td>
                  <td>
                    <span className={`status-badge status-${op.status === 'active' ? 'active' : op.status === 'pending' ? 'pending' : 'inactive'}`}>
                      {op.status}
                    </span>
                  </td>
                  <td>{op._count.apiKeys}</td>
                  <td>{op._count.oauthClients}</td>
                  <td className="table-actions">
                    {op.status !== 'active' && (
                      <button type="button" className="btn-primary btn-sm" onClick={() => setStatus(op.id, 'active')}>
                        承認
                      </button>
                    )}
                    {op.status !== 'suspended' && (
                      <button type="button" className="btn-danger" onClick={() => setStatus(op.id, 'suspended')}>
                        停止
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {operators.length === 0 && <p className="hint">運営者がいません</p>}
        </div>
      )}
    </main>
  );
}

export default function OperatorsPage() {
  return (
    <RequireAuth>
      <OperatorsContent />
    </RequireAuth>
  );
}
