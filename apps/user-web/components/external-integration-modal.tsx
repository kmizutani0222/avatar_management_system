'use client';

interface ExternalIntegrationModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExternalIntegrationModal({ open, onClose }: ExternalIntegrationModalProps) {
  if (!open) return null;

  return (
    <div className="ams-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="ams-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="external-integration-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ams-modal-header">
          <h2 id="external-integration-title">外部連携について</h2>
          <button type="button" className="ams-modal-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>
        <div className="ams-modal-body">
          <p className="hint">
            ここでは<strong>あなた（ユーザー）がこのサイトで行う操作</strong>だけを説明します。
            各サイト（運営側）での連携手順は、OAuth か API キーかなど連携方式によって異なります。
          </p>
          <ul className="external-help-list">
            <li>
              <strong>サイト内での操作</strong> — パーツの組み立て・着せ替えはこのサイト内だけで行います。
              保存したアバターは VRM/GLB に変換され、外部サイトはそのファイルを取得して表示します。
            </li>
            <li>
              <strong>どのアバターを公開するか</strong> — 各アバターカードの「外部連携 ON/OFF」で、
              外部サイトに公開するアバターを選びます。OFF のアバターは外部から取得できません。
            </li>
            <li>
              <strong>OAuth 連携の場合</strong> — 外部サイトの案内に従い、AMS にログインして連携を許可するだけで大丈夫です。
              ユーザー ID の手入力は不要です。
            </li>
            <li>
              <strong>API キー方式の場合</strong> — アカウント画面のユーザー ID を、連携先サイトの案内に従って伝えます。
              サイトごとに登録方法が異なります。
            </li>
            <li>
              <strong>安全のために</strong> — 不要になったアバターは外部連携を OFF にしてください。
              ON にしたアバターは、承認済みの外部サービスから参照可能になります。
            </li>
          </ul>
          <div className="ams-modal-actions">
            <button type="button" className="btn-primary" onClick={onClose}>
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
