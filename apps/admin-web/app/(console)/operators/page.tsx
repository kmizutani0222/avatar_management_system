'use client';

import { PageHeader } from '@ams/admin-ui';
import { useEffect, useState } from 'react';
import { useAuth } from '@ams/web-auth';
import { AdminOperator, fetchAdminOperators, updateAdminOperator } from '@/lib/admin-api';

export default function OperatorsPage() {
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
    <>
      <PageHeader title="運営者管理" subtitle="外部サイト運営者の承認・停止" />

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
                      <button type="button" className="btn-danger btn-sm" onClick={() => setStatus(op.id, 'suspended')}>
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
    </>
  );
}
