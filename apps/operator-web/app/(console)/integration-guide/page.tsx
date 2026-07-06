'use client';

import Link from 'next/link';
import { PageHeader } from '@ams/admin-ui';

const GUIDE_PDF_PATH = '/docs/ams-site-integration-guide.pdf';

export default function IntegrationGuidePage() {
  return (
    <>
      <PageHeader
        title="導入手順書"
        subtitle="外部サイトへ AMS 連携を導入するためのPDF資料"
        actions={
          <a
            href={GUIDE_PDF_PATH}
            download="ams-site-integration-guide.pdf"
            className="btn-primary"
          >
            PDFをダウンロード
          </a>
        }
      />

      <div className="card integration-guide-card">
        <h2>AMS サイト導入手順書</h2>
        <p className="hint">
          OAuth 方式・API キー方式の選び方、運営者側で必要な設定、SDK 実装例、
          動作確認チェックリストをまとめたPDFです。
        </p>

        <div className="guide-actions">
          <a
            href={GUIDE_PDF_PATH}
            download="ams-site-integration-guide.pdf"
            className="btn-primary"
          >
            PDFをダウンロード
          </a>
          <a href={GUIDE_PDF_PATH} target="_blank" rel="noreferrer" className="btn-secondary">
            ブラウザで開く
          </a>
        </div>
      </div>

      <div className="card">
        <h2>手順書の内容</h2>
        <ul className="checklist">
          <li>OAuth 方式と API キー方式の選択基準</li>
          <li>OAuth クライアント・redirect URI の設定手順</li>
          <li>API キー方式で必要なユーザー ID の扱い</li>
          <li>@ams/sdk-web / @ams/sdk-three を使った最小実装例</li>
          <li>本番導入前の動作確認チェックリスト</li>
          <li>client_secret・API キーの保管などセキュリティ上の注意</li>
        </ul>
        <p className="hint">
          実際の API 動作は <Link href="/sandbox">SDK サンドボックス</Link>、
          詳細な実装リファレンスは <Link href="/sdk">SDK ガイド</Link> でも確認できます。
        </p>
      </div>
    </>
  );
}
