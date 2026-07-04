'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RequireAuth, useAuth } from '@ams/web-auth';
import { AvatarBodyType } from '@ams/shared-types';
import { AvatarCreator } from '@/components/avatar-creator';
import { ApiPart, BODY_TYPE_LABELS, createAvatar, fetchParts } from '@/lib/avatars';

function NewPartsAvatarContent() {
  const { token } = useAuth();
  const router = useRouter();
  const [bodyType, setBodyType] = useState<AvatarBodyType | null>(null);
  const [parts, setParts] = useState<ApiPart[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bodyType) return;
    setLoading(true);
    fetchParts(bodyType)
      .then(setParts)
      .catch(() => setParts([]))
      .finally(() => setLoading(false));
  }, [bodyType]);

  if (!bodyType) {
    return (
      <main>
        <h1>パーツ選択式</h1>
        <p className="subtitle">body_type を選択してください</p>
        <div className="body-type-grid">
          {Object.values(AvatarBodyType).map((type) => (
            <button
              key={type}
              type="button"
              className="body-type-card"
              onClick={() => setBodyType(type)}
            >
              <strong>{BODY_TYPE_LABELS[type]}</strong>
              <span>{type}</span>
            </button>
          ))}
        </div>
        <p className="footer-link">
          <Link href="/avatars/new">作成方法を変更</Link>
        </p>
      </main>
    );
  }

  if (loading) return <main><p className="loading-text">パーツ読み込み中...</p></main>;
  if (!parts.length) return <main><p className="form-error">パーツが見つかりません</p></main>;

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>パーツ選択式</h1>
          <p className="subtitle">{BODY_TYPE_LABELS[bodyType]}</p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => setBodyType(null)}>
          タイプ変更
        </button>
      </header>

      <AvatarCreator
        parts={parts}
        bodyType={bodyType}
        submitLabel="アバターを作成"
        onCancel={() => router.push('/dashboard')}
        onSubmit={async ({ name, selections }) => {
          if (!token) return;
          await createAvatar(token, {
            name,
            bodyType,
            partsConfig: { selections },
          });
          router.push('/dashboard');
        }}
      />
    </main>
  );
}

export default function NewPartsAvatarPage() {
  return (
    <RequireAuth>
      <NewPartsAvatarContent />
    </RequireAuth>
  );
}
