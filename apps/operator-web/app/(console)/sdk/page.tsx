'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PageHeader } from '@ams/admin-ui';
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

function SdkPage() {
  const apiBase = getApiUrl();

  const npmExample = useMemo(
    () => `import { AmsClient } from '@ams/sdk-web';

// OAuth（ブラウザ / バックエンド）
const client = new AmsClient({
  apiBase: '${apiBase}',
  accessToken: '<access_token>',
});

// API キー（サーバーサイドのみ）
const serverClient = new AmsClient({
  apiBase: '${apiBase}',
  apiKey: '<api_key>',
  userId: '<ams_user_id>',
});

const avatars = await client.listAvatars();
const model = await client.fetchModel(avatars[0].id); // ArrayBuffer (VRM/GLB)`,
    [apiBase],
  );

  const glbSdkExample = useMemo(
    () => `import { AmsClient } from '@ams/sdk-web';
import { loadAmsModel, isLoadedGlb, updateGlbRuntime, updateVrmRuntime } from '@ams/sdk-three';

const client = new AmsClient({ apiBase: '${apiBase}', accessToken });
const model = await loadAmsModel(client, avatarId);

if (isLoadedGlb(model)) {
  scene.add(model.scene);
  function animate(delta: number) {
    updateGlbRuntime(model, delta, { sway: true });
    renderer.render(scene, camera);
  }
  model.dispose();
} else {
  scene.add(model.vrm.scene);
  function animate(delta: number) {
    updateVrmRuntime(model.vrm, delta, { lookAtTarget: camera });
    renderer.render(scene, camera);
  }
  model.dispose();
}`,
    [apiBase],
  );

  const threeSdkExample = useMemo(
    () => `import * as THREE from 'three';
import { AmsClient } from '@ams/sdk-web';
import { loadAmsVrm, updateVrmRuntime } from '@ams/sdk-three';

const client = new AmsClient({ apiBase: '${apiBase}', accessToken });
const { vrm, dispose } = await loadAmsVrm(client, avatarId);

scene.add(vrm.scene);

function animate(deltaTime: number) {
  updateVrmRuntime(vrm, deltaTime, {
    lookAtTarget: camera,
    expressions: { happy: 0.8, blink: 0 },
  });
  renderer.render(scene, camera);
}

dispose(); // 画面を閉じるとき`,
    [apiBase],
  );

  return (
    <>
      <PageHeader
        title="SDK ガイド"
        subtitle="@ams/sdk-web / @ams/sdk-three を使った外部サイト連携の実装リファレンス"
      />

      <div className="card">
        <h2>概要</h2>
        <ul className="hint-list">
          <li>外部サイトでは AMS 上で保存済みの <strong>ベイク済み VRM/GLB</strong> を取得して表示します。</li>
          <li>着せ替え（パーツ選択）は AMS サイト内で行い、外部側でパーツ API を呼ぶ必要はありません。</li>
          <li>humanoid_vrm は VRM 1.0（表情・LookAt・SpringBone 付き）。四足/マスコットは GLB + <code>updateGlbRuntime</code> の sway 対応。</li>
          <li>ユーザーが設定した <code>expressionPresets</code> は <code>getAvatar()</code> で取得し、実行時に切り替えられます。</li>
        </ul>
      </div>

      <div className="card">
        <h2>OAuth 連携の役割分担</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>担当</th>
              <th>実装場所</th>
              <th>やること</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ユーザー</td>
              <td>外部サイト（ユーザー UI）</td>
              <td>「AMS と連携」→ AMS ログイン → 連携を許可（認可 code が発行される）</td>
            </tr>
            <tr>
              <td>運営者</td>
              <td>外部サイトサーバー</td>
              <td>認可 code を access_token に交換（client_secret はサーバーのみ）</td>
            </tr>
            <tr>
              <td>運営者</td>
              <td>外部サイト（SDK）</td>
              <td><code>new AmsClient({'{ accessToken }'})</code> → listAvatars / fetchModel など</td>
            </tr>
          </tbody>
        </table>
        <p className="hint">
          ステップごとの動作確認は <Link href="/sandbox">SDK サンドボックス</Link> を利用してください。
          連携開始 URL は AMS ユーザー画面（:4001）の <code>/oauth/authorize</code> です。
        </p>
      </div>

      <div className="card">
        <h2>API キー方式の役割分担</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>担当</th>
              <th>やること</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ユーザー</td>
              <td>AMS 上でアバターの <strong>外部連携 ON</strong>。連携時に AMS ユーザー ID を運営者側へ伝える</td>
            </tr>
            <tr>
              <td>運営者</td>
              <td>サーバーで API キーを保持し、ユーザー ID と組み合わせて <code>AmsClient</code> を作成</td>
            </tr>
          </tbody>
        </table>
        <p className="hint">
          OAuth クライアント・API キーの発行は{' '}
          <Link href="/oauth-clients">OAuth クライアント管理</Link> /{' '}
          <Link href="/api-keys">API キー管理</Link> を参照してください。
        </p>
      </div>

      <div className="card">
        <h2>@ams/sdk-web — クイックスタート</h2>
        <p className="hint">モノレポ内パッケージ。npm 公開前は workspace 参照またはソースコピーで利用できます。</p>
        <CodeBlock code={npmExample} />
      </div>

      <div className="card">
        <h2>@ams/sdk-web — AmsClient API</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>メソッド</th>
              <th>戻り値</th>
              <th>用途</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>listAvatars()</code></td>
              <td><code>ExternalAvatar[]</code></td>
              <td>連携可能なアバター一覧（<code>hasModel</code> でモデル有無を確認）</td>
            </tr>
            <tr>
              <td><code>getAvatar(id)</code></td>
              <td><code>ExternalAvatar</code></td>
              <td>メタデータ・<code>expressionPresets</code>・<code>format</code> など</td>
            </tr>
            <tr>
              <td><code>fetchModel(id)</code></td>
              <td><code>ArrayBuffer</code></td>
              <td>ベイク済み VRM/GLB バイナリ</td>
            </tr>
            <tr>
              <td><code>fetchThumbnail(id)</code></td>
              <td><code>ArrayBuffer</code></td>
              <td>PNG サムネイル（<code>hasThumbnail === true</code> の場合）</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>@ams/sdk-three — VRM 表示</h2>
        <p className="hint">
          Three.js / @pixiv/three-vrm のロード処理をラップします。scene / camera / renderer を用意し、
          読み込んだ <code>vrm.scene</code> を追加します。
        </p>
        <CodeBlock code={threeSdkExample} />
      </div>

      <div className="card">
        <h2>@ams/sdk-three — VRM / GLB 自動判別</h2>
        <p className="hint">
          <code>loadAmsModel</code> は avatar の format に応じて VRM または GLB をロードします。
        </p>
        <CodeBlock code={glbSdkExample} />
      </div>

      <div className="card">
        <h2>@ams/sdk-three — 主要ヘルパー</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>関数</th>
              <th>用途</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>loadAmsModel(client, id)</code></td>
              <td>format に応じて VRM / GLB を自動判別してロード</td>
            </tr>
            <tr>
              <td><code>loadAmsVrm(client, id)</code></td>
              <td>VRM 専用ロード</td>
            </tr>
            <tr>
              <td><code>updateVrmRuntime(vrm, dt, opts)</code></td>
              <td>表情・LookAt・移動アニメーションを毎フレーム更新</td>
            </tr>
            <tr>
              <td><code>updateGlbRuntime(model, dt, opts)</code></td>
              <td>四足/マスコット GLB のしっぽ sway など</td>
            </tr>
            <tr>
              <td><code>loaded.dispose()</code></td>
              <td>シーン除去・GPU リソース解放</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>動作確認</h2>
        <p className="hint">
          ステップごとに SDK を実行して結果を確認する場合は{' '}
          <Link href="/sandbox">SDK サンドボックス</Link> を利用してください。
        </p>
      </div>
    </>
  );
}

export default SdkPage;
