'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RequireAuth, useAuth } from '@ams/web-auth';
import { AvatarBodyType } from '@ams/shared-types';
import { AvatarCreator } from '@/components/avatar-creator';
import {
  ApiAvatar,
  ApiPart,
  BODY_TYPE_LABELS,
  fetchAvatar,
  fetchParts,
  updateAvatar,
} from '@/lib/avatars';

function EditAvatarContent() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [avatar, setAvatar] = useState<ApiAvatar | null>(null);
  const [parts, setParts] = useState<ApiPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetchAvatar(token, id)
      .then((av) => {
        setAvatar(av);
        return fetchParts(av.bodyType as AvatarBodyType);
      })
      .then(setParts)
      .catch((err) => setError(err instanceof Error ? err.message : '読み込み失敗'))
      .finally(() => setLoading(false));
  }, [token, id]);

  if (loading) return <main><p className="loading-text">読み込み中...</p></main>;
  if (error || !avatar) return <main><p className="form-error">{error || 'Not found'}</p></main>;

  if (avatar.sourceType !== 'parts') {
    return (
      <main>
        <p className="form-error">パーツ選択式アバターのみ編集できます。</p>
        <Link href="/dashboard">ダッシュボードに戻る</Link>
      </main>
    );
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>アバターを編集</h1>
          <p className="subtitle">{BODY_TYPE_LABELS[avatar.bodyType as AvatarBodyType]}</p>
        </div>
      </header>

      <AvatarCreator
        parts={parts}
        bodyType={avatar.bodyType as AvatarBodyType}
        initialName={avatar.name}
        initialSelections={avatar.partsConfig?.selections ?? {}}
        submitLabel="変更を保存"
        onCancel={() => router.push('/dashboard')}
        onSubmit={async ({ name, selections }) => {
          if (!token) return;
          await updateAvatar(token, id, {
            name,
            partsConfig: { selections },
          });
          router.push('/dashboard');
        }}
      />
    </main>
  );
}

export default function EditAvatarPage() {
  return (
    <RequireAuth>
      <EditAvatarContent />
    </RequireAuth>
  );
}
