'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { RequireAuth } from '@ams/web-auth';
import { getApiUrl } from '@/lib/api';

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="code-block-wrap">
      <button type="button" className="code-copy-btn" onClick={copy}>
        {copied ? 'コピー済' : 'コピー'}
      </button>
      <pre className="code-block">{code}</pre>
    </div>
  );
}

function SdkContent() {
  const apiBase = getApiUrl();

  const npmExample = useMemo(
    () => `import { AmsClient } from '@ams/sdk-web';

// OAuth (ブラウザ / バックエンド)
const client = new AmsClient({
  apiBase: '${apiBase}',
  accessToken: '<access_token>',
});

// API キー (サーバーサイドのみ)
const serverClient = new AmsClient({
  apiBase: '${apiBase}',
  apiKey: '<api_key>',
  userId: '<ams_user_id>',
});

const avatars = await client.listAvatars();
const model = await client.fetchModel(avatars[0].id); // ArrayBuffer (VRM/GLB)`,
    [apiBase],
  );

  const curlExample = useMemo(
    () => `# API キー
curl -H "X-API-Key: <key>" -H "X-User-Id: <user_id>" \\
  ${apiBase}/api/v1/avatars

# OAuth Bearer
curl -H "Authorization: Bearer <token>" \\
  ${apiBase}/api/v1/avatars/<avatar_id>/model -o avatar.vrm`,
    [apiBase],
  );

  const threeExample = useMemo(
    () => `import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { AmsClient } from '@ams/sdk-web';

const client = new AmsClient({ apiBase: '${apiBase}', accessToken });
const buffer = await client.fetchModel(avatarId);
const blob = new Blob([buffer]);
const url = URL.createObjectURL(blob);

const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));
const gltf = await loader.loadAsync(url);
const vrm = gltf.userData.vrm;
VRMUtils.rotateVRM0(vrm);
URL.revokeObjectURL(url);`,
    [apiBase],
  );

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>SDK ガイド</h1>
          <p className="subtitle">確定済み VRM/GLB の取得（パーツ組み立ては AMS 内で完了）</p>
        </div>
        <Link href="/dashboard" className="btn-secondary">ダッシュボード</Link>
      </header>

      <div className="card">
        <h2>概要</h2>
        <ul className="hint-list">
          <li>外部連携では <code>GET /api/v1/avatars/:id/model</code> でベイク済みモデルのみ取得します。</li>
          <li><code>partsConfig</code> は外部 API に含まれません。着せ替えは AMS サイト内で行い、保存時に VRM/GLB が生成されます。</li>
          <li><code>MODEL_DELIVERY=presigned</code> 時は 302 リダイレクトで署名 URL にフォローしてください（SDK は <code>redirect: follow</code> 対応）。</li>
        </ul>
      </div>

      <div className="card">
        <h2>@ams/sdk-web</h2>
        <p className="hint">モノレポ内パッケージ。npm 公開前は workspace 参照またはソースコピーで利用できます。</p>
        <CodeBlock code={npmExample} />
      </div>

      <div className="card">
        <h2>REST (curl)</h2>
        <CodeBlock code={curlExample} />
      </div>

      <div className="card">
        <h2>Three.js + @pixiv/three-vrm</h2>
        <p className="hint">取得した ArrayBuffer を Blob URL 経由でロードする例です。</p>
        <CodeBlock code={threeExample} />
      </div>

      <div className="card">
        <h2>エンドポイント</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>説明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GET</td>
              <td>/api/v1/avatars</td>
              <td>公開可能なアバター一覧</td>
            </tr>
            <tr>
              <td>GET</td>
              <td>/api/v1/avatars/:id</td>
              <td>メタデータ（モデル URL なし）</td>
            </tr>
            <tr>
              <td>GET</td>
              <td>/api/v1/avatars/:id/model</td>
              <td>ベイク済み VRM/GLB バイナリ</td>
            </tr>
            <tr>
              <td>GET</td>
              <td>/api/v1/avatars/:id/thumbnail</td>
              <td>PNG サムネイル（hasThumbnail が true の場合）</td>
            </tr>
          </tbody>
        </table>
        <p className="hint">
          詳細は <a href={`${apiBase}/api/docs`} target="_blank" rel="noreferrer">Swagger UI</a> または{' '}
          <Link href="/sandbox">連携サンドボックス</Link> を参照してください。
        </p>
      </div>
    </main>
  );
}

export default function SdkPage() {
  return (
    <RequireAuth>
      <SdkContent />
    </RequireAuth>
  );
}
