'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RequireAuth, useAuth } from '@ams/web-auth';
import AmsClient, { type ExternalAvatar } from '@ams/sdk-web';
import {
  DEFAULT_LOCOMOTION_INPUT,
  hasDirectionInput,
  type ExpressionValues,
  type LocomotionInput,
} from '@ams/sdk-three';
import { getApiUrl } from '@/lib/api';
import { BODY_TYPE_LABELS, fetchAvatars } from '@/lib/avatars';
import type { SdkDemoCapabilities } from '@/components/sdk-demo-scene';

const SdkDemoScene = dynamic(
  () => import('@/components/sdk-demo-scene').then((m) => m.SdkDemoScene),
  {
    ssr: false,
    loading: () => <div className="preview-loading">3D ビューアを読み込み中…</div>,
  },
);

const KEY_TO_DIRECTION: Record<string, keyof Pick<LocomotionInput, 'forward' | 'backward' | 'left' | 'right'>> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

function SdkDemoContent() {
  const { token } = useAuth();
  const client = useMemo(
    () => (token ? new AmsClient({ apiBase: getApiUrl(), accessToken: token }) : null),
    [token],
  );

  const [avatars, setAvatars] = useState<ExternalAvatar[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<SdkDemoCapabilities | null>(null);
  const [expressions, setExpressions] = useState<ExpressionValues>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [swayEnabled, setSwayEnabled] = useState(true);
  const [privateModelCount, setPrivateModelCount] = useState(0);

  const locomotionInputRef = useRef<LocomotionInput>({ ...DEFAULT_LOCOMOTION_INPUT });
  const runHeldRef = useRef(false);
  const [, tickInput] = useState(0);

  function syncLocomotionMode() {
    const input = locomotionInputRef.current;
    if (!hasDirectionInput(input)) {
      input.mode = 'idle';
      return;
    }
    input.mode = runHeldRef.current ? 'run' : 'walk';
  }

  useEffect(() => {
    if (!client || !token) return;
    setLoadingList(true);
    setListError(null);
    setPrivateModelCount(0);

    Promise.all([client.listAvatars(), fetchAvatars(token).catch(() => [])])
      .then(([list, owned]) => {
        const usable = list.filter((avatar) => avatar.hasModel);
        setAvatars(usable);
        setSelectedId((prev) => {
          if (prev && usable.some((avatar) => avatar.id === prev)) return prev;
          return usable[0]?.id ?? '';
        });

        if (usable.length === 0) {
          const hidden = owned.filter((avatar) => avatar.modelUrl && !avatar.externalEnabled);
          setPrivateModelCount(hidden.length);
        }
      })
      .catch((error: unknown) => {
        const detail = error instanceof Error ? error.message : '';
        if (detail.includes('401')) {
          setListError('認証に失敗しました。再ログインしてください。');
        } else {
          setListError(
            detail
              ? `外部連携アバターの取得に失敗しました（${detail}）`
              : '外部連携アバターの取得に失敗しました',
          );
        }
      })
      .finally(() => setLoadingList(false));
  }, [client, token]);

  useEffect(() => {
    function resetDirections() {
      locomotionInputRef.current.forward = false;
      locomotionInputRef.current.backward = false;
      locomotionInputRef.current.left = false;
      locomotionInputRef.current.right = false;
      locomotionInputRef.current.jumpPressed = false;
      runHeldRef.current = false;
      syncLocomotionMode();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.code === 'Space') {
        event.preventDefault();
        locomotionInputRef.current.jumpPressed = true;
        tickInput((n) => n + 1);
        return;
      }

      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        runHeldRef.current = true;
        syncLocomotionMode();
        tickInput((n) => n + 1);
        return;
      }

      const direction = KEY_TO_DIRECTION[event.code];
      if (direction) {
        event.preventDefault();
        locomotionInputRef.current[direction] = true;
        syncLocomotionMode();
        tickInput((n) => n + 1);
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.code === 'Space') {
        locomotionInputRef.current.jumpPressed = false;
        tickInput((n) => n + 1);
        return;
      }

      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        runHeldRef.current = false;
        syncLocomotionMode();
        tickInput((n) => n + 1);
        return;
      }

      const direction = KEY_TO_DIRECTION[event.code];
      if (direction) {
        locomotionInputRef.current[direction] = false;
        syncLocomotionMode();
        tickInput((n) => n + 1);
      }
    }

    function onBlur() {
      resetDirections();
      tickInput((n) => n + 1);
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  const selectedAvatar = avatars.find((avatar) => avatar.id === selectedId);

  const handleLoaded = useCallback((info: SdkDemoCapabilities) => {
    setModelError(null);
    setCapabilities(info);
    runHeldRef.current = false;
    locomotionInputRef.current = { ...DEFAULT_LOCOMOTION_INPUT };

    const initial: ExpressionValues = {};
    for (const name of info.expressionNames) {
      initial[name] = 0;
    }
    setExpressions(initial);
    setActivePreset(null);
  }, []);

  const handleModelError = useCallback((message: string) => {
    setModelError(message);
    setCapabilities(null);
  }, []);

  function handleExpressionChange(name: string, value: number) {
    setExpressions((prev) => ({ ...prev, [name]: value }));
    setActivePreset(null);
  }

  function applyPreset(name: string | null) {
    setActivePreset(name);
    const zeroed: ExpressionValues = {};
    for (const expr of capabilities?.expressionNames ?? []) {
      zeroed[expr] = 0;
    }
    const preset = name ? selectedAvatar?.expressionPresets?.[name] : undefined;
    setExpressions({ ...zeroed, ...(preset ?? {}) });
  }

  const presetNames = Object.keys(selectedAvatar?.expressionPresets ?? {});

  function triggerJump() {
    locomotionInputRef.current.jumpPressed = true;
    tickInput((n) => n + 1);
    window.setTimeout(() => {
      locomotionInputRef.current.jumpPressed = false;
      tickInput((n) => n + 1);
    }, 120);
  }

  function setDirection(direction: keyof Pick<LocomotionInput, 'forward' | 'backward' | 'left' | 'right'>, active: boolean) {
    locomotionInputRef.current[direction] = active;
    syncLocomotionMode();
    tickInput((n) => n + 1);
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <span className="badge badge-user">User :4001</span>
          <h1>SDK デモ</h1>
          <p className="subtitle">外部連携 ON のアバターを SDK 経由で操作します</p>
        </div>
        <div className="header-actions">
          <Link href="/dashboard" className="btn-secondary">
            ダッシュボード
          </Link>
        </div>
      </header>

      <div className="sdk-demo-layout">
        <section className="creator-preview sdk-demo-preview">
          {loadingList ? (
            <div className="preview-loading">アバター一覧を読み込み中…</div>
          ) : listError ? (
            <div className="preview-loading status-error">{listError}</div>
          ) : avatars.length === 0 ? (
            <div className="preview-loading">
              <p>外部連携 ON のアバターがありません</p>
              {privateModelCount > 0 && (
                <p className="hint sdk-demo-empty-hint">
                  モデル付きのアバターが {privateModelCount} 件ありますが、外部連携が OFF
                  です。ダッシュボードで ON にしてください。
                </p>
              )}
              <Link href="/dashboard" className="btn-primary sdk-demo-empty-link">
                ダッシュボードへ
              </Link>
            </div>
          ) : !selectedId || !client ? (
            <div className="preview-loading">アバターを選択してください</div>
          ) : (
            <>
              {modelError && <p className="sdk-demo-error">{modelError}</p>}
              <SdkDemoScene
                key={selectedId}
                client={client}
                avatarId={selectedId}
                expressions={expressions}
                locomotionInput={locomotionInputRef.current}
                swayEnabled={swayEnabled}
                onLoaded={handleLoaded}
                onError={handleModelError}
              />
            </>
          )}
        </section>

        <aside className="creator-form sdk-demo-controls">
          <div className="card" style={{ marginTop: 0 }}>
            <h2>アバター</h2>
            {avatars.length === 0 ? (
              <p className="hint">外部連携 ON のアバターが必要です。</p>
            ) : (
              <label className="field-label">
                選択
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  disabled={loadingList}
                >
                  {avatars.map((avatar) => (
                    <option key={avatar.id} value={avatar.id}>
                      {avatar.name} ({BODY_TYPE_LABELS[avatar.bodyType] ?? avatar.bodyType})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {capabilities?.hasHumanoid && (
            <div className="card">
              <h2>移動</h2>
              <p className="hint">方向ボタンを押している間だけ歩きます。Shift を押しながらで走行。</p>
              <div className="sdk-demo-mode-buttons">
                <button type="button" className="btn-secondary btn-sm" onClick={triggerJump}>
                  ジャンプ
                </button>
              </div>
              <div className="sdk-demo-dpad">
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onPointerDown={() => setDirection('forward', true)}
                  onPointerUp={() => setDirection('forward', false)}
                  onPointerLeave={() => setDirection('forward', false)}
                >
                  ↑
                </button>
                <div className="sdk-demo-dpad-row">
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onPointerDown={() => setDirection('left', true)}
                    onPointerUp={() => setDirection('left', false)}
                    onPointerLeave={() => setDirection('left', false)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onPointerDown={() => setDirection('backward', true)}
                    onPointerUp={() => setDirection('backward', false)}
                    onPointerLeave={() => setDirection('backward', false)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onPointerDown={() => setDirection('right', true)}
                    onPointerUp={() => setDirection('right', false)}
                    onPointerLeave={() => setDirection('right', false)}
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          )}

          {capabilities?.hasExpressions && presetNames.length > 0 && (
            <div className="card">
              <h2>表情プリセット</h2>
              <div className="sdk-demo-mode-buttons">
                <button
                  type="button"
                  className={activePreset === null ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                  onClick={() => applyPreset(null)}
                >
                  通常
                </button>
                {presetNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={activePreset === name ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                    onClick={() => applyPreset(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <p className="hint">
                プリセットは各アバターの「表情設定」画面で編集できます。
              </p>
            </div>
          )}

          {capabilities?.hasExpressions && (
            <div className="card">
              <h2>表情（個別調整）</h2>
              {capabilities.expressionNames.map((expr) => (
                <label key={expr} className="slider-label">
                  {expr}
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={expressions[expr] ?? 0}
                    onChange={(e) => handleExpressionChange(expr, Number(e.target.value))}
                  />
                  <span className="slider-value">{(expressions[expr] ?? 0).toFixed(2)}</span>
                </label>
              ))}
            </div>
          )}

          {capabilities?.hasSway && (
            <div className="card">
              <h2>付属パーツ</h2>
              <label className="sdk-toggle">
                <input
                  type="checkbox"
                  checked={swayEnabled}
                  onChange={(e) => setSwayEnabled(e.target.checked)}
                />
                しっぽ・背中の揺れ
              </label>
            </div>
          )}

          {selectedAvatar && capabilities && !capabilities.hasHumanoid && !capabilities.hasExpressions && !capabilities.hasSway && (
            <div className="card">
              <p className="hint">このモデルで SDK から操作できる項目はありません。</p>
            </div>
          )}
        </aside>
      </div>

      <p className="footer-link">
        <Link href="/">トップに戻る</Link>
      </p>
    </main>
  );
}

export default function SdkDemoPage() {
  return (
    <RequireAuth>
      <SdkDemoContent />
    </RequireAuth>
  );
}
