'use client';

import Link from 'next/link';
import { PageHeader } from '@ams/admin-ui';

const METHODS = [
  {
    href: '/avatars/new/parts',
    title: 'パーツ選択式',
    description: 'サイト内でパーツを組み合わせて作成・着せ替え。保存時に VRM/GLB を生成します',
    badge: '推奨',
  },
  {
    href: '/avatars/new/upload',
    title: 'VRM アップロード',
    description: '既存の .vrm ファイルをアップロード（humanoid_vrm のみ）',
    badge: 'VRM',
  },
  {
    href: '/avatars/new/editor',
    title: 'VRM エディタ',
    description: 'VRM を読み込み、表情（BlendShape）を調整して保存',
    badge: 'VRM',
  },
];

function NewAvatarHub() {
  return (
    <>
      <PageHeader title="アバターを作成" subtitle="作成方法を選択してください" />

      <div className="method-grid">
        {METHODS.map((method) => (
          <Link key={method.href} href={method.href} className="method-card">
            <span className="method-badge">{method.badge}</span>
            <strong>{method.title}</strong>
            <p>{method.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function NewAvatarPage() {
  return <NewAvatarHub />;
}
