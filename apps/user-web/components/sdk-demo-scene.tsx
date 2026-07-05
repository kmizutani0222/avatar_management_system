'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, type RefObject } from 'react';
import type { Group, PerspectiveCamera } from 'three';
import { MathUtils, Vector3 } from 'three';
import AmsClient from '@ams/sdk-web';
import {
  applyVrmRestPose,
  createVrmLocomotionState,
  hasVrmHumanoid,
  isLoadedGlb,
  isLoadedVrm,
  loadAmsModel,
  updateGlbRuntime,
  updateVrmRuntime,
  type ExpressionValues,
  type LoadedAmsModel,
  type LocomotionInput,
  type VrmLocomotionState,
} from '@ams/sdk-three';

export interface SdkDemoCapabilities {
  isVrm: boolean;
  hasHumanoid: boolean;
  hasExpressions: boolean;
  expressionNames: string[];
  hasSway: boolean;
}

export interface SdkDemoSceneProps {
  client: AmsClient;
  avatarId: string;
  expressions: ExpressionValues;
  locomotionInput: LocomotionInput;
  swayEnabled: boolean;
  onLoaded?: (info: SdkDemoCapabilities) => void;
  onError?: (message: string) => void;
}

const CAMERA_DISTANCE = 3.2;
const DEFAULT_FOV = 42;
const MIN_FOV = 22;
const MAX_FOV = 62;

function FollowCamera({
  targetRef,
  fovRef,
}: {
  targetRef: RefObject<Group | null>;
  fovRef: RefObject<number>;
}) {
  const { camera } = useThree();
  const lookAt = useRef(new Vector3());
  const desiredPos = useRef(new Vector3());

  useFrame((_state, delta) => {
    const target = targetRef.current;
    if (!target) return;
    // 胸〜顔を中心にフレーミング（拡大時も上半身が見える）
    lookAt.current.set(target.position.x, target.position.y + 1.0, target.position.z);
    desiredPos.current.set(
      lookAt.current.x,
      lookAt.current.y + 0.35,
      lookAt.current.z + CAMERA_DISTANCE,
    );
    camera.position.lerp(desiredPos.current, 1 - Math.exp(-4 * delta));
    camera.lookAt(lookAt.current);

    const persp = camera as PerspectiveCamera;
    persp.fov = MathUtils.lerp(persp.fov, fovRef.current, 1 - Math.exp(-8 * delta));
    persp.updateProjectionMatrix();
  });

  return null;
}

function SdkDemoModel({
  client,
  avatarId,
  expressions,
  locomotionInput,
  swayEnabled,
  fovRef,
  onLoaded,
  onError,
}: SdkDemoSceneProps & { fovRef: RefObject<number> }) {
  const rootRef = useRef<Group>(null);
  const modelRef = useRef<LoadedAmsModel | null>(null);
  const locomotionRef = useRef<VrmLocomotionState>(createVrmLocomotionState());
  const { camera } = useThree();

  useEffect(() => {
    let disposed = false;
    modelRef.current?.dispose();
    modelRef.current = null;
    locomotionRef.current = createVrmLocomotionState();
    if (rootRef.current) {
      rootRef.current.position.set(0, -0.5, 0);
      rootRef.current.rotation.set(0, 0, 0);
      rootRef.current.clear();
    }

    loadAmsModel(client, avatarId)
      .then((loaded) => {
        if (disposed) {
          loaded.dispose();
          return;
        }

        modelRef.current = loaded;
        if (!rootRef.current) return;

        if (isLoadedVrm(loaded)) {
          loaded.vrm.scene.rotation.y = Math.PI;
          applyVrmRestPose(loaded.vrm);
          rootRef.current.add(loaded.vrm.scene);
          const expressionNames =
            loaded.vrm.expressionManager?.expressions.map((expr) => expr.expressionName) ?? [];
          onLoaded?.({
            isVrm: true,
            hasHumanoid: hasVrmHumanoid(loaded.vrm),
            hasExpressions: expressionNames.length > 0,
            expressionNames,
            hasSway: false,
          });
        } else if (isLoadedGlb(loaded)) {
          rootRef.current.add(loaded.scene);
          onLoaded?.({
            isVrm: false,
            hasHumanoid: false,
            hasExpressions: false,
            expressionNames: [],
            hasSway: loaded.swayNodes.length > 0,
          });
        }
      })
      .catch((error: unknown) => {
        onError?.(error instanceof Error ? error.message : 'モデルの読み込みに失敗しました');
      });

    return () => {
      disposed = true;
      modelRef.current?.dispose();
      modelRef.current = null;
      if (rootRef.current) rootRef.current.clear();
    };
  }, [client, avatarId, onLoaded, onError]);

  useFrame((_, delta) => {
    const model = modelRef.current;
    const root = rootRef.current;
    if (!model || !root) return;

    if (isLoadedVrm(model)) {
      updateVrmRuntime(model.vrm, delta, {
        expressions,
        lookAtTarget: camera,
        locomotion: locomotionInput,
        locomotionState: locomotionRef.current,
      });

      const loco = locomotionRef.current;
      root.position.set(loco.position.x, -0.5 + loco.position.y, loco.position.z);
      root.rotation.y = loco.heading;
    } else if (isLoadedGlb(model)) {
      updateGlbRuntime(model, delta, { sway: swayEnabled });
    }
  });

  return (
    <>
      <group ref={rootRef} />
      <FollowCamera targetRef={rootRef} fovRef={fovRef} />
    </>
  );
}

export function SdkDemoScene(props: SdkDemoSceneProps) {
  const fovRef = useRef(DEFAULT_FOV);
  const canvasRef = useRef<HTMLDivElement>(null);

  function clampFov(value: number) {
    return Math.min(MAX_FOV, Math.max(MIN_FOV, value));
  }

  function adjustZoom(delta: number) {
    fovRef.current = clampFov(fovRef.current + delta);
  }

  function resetZoom() {
    fovRef.current = DEFAULT_FOV;
  }

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      adjustZoom(event.deltaY > 0 ? 2.5 : -2.5);
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    fovRef.current = DEFAULT_FOV;
  }, [props.avatarId]);

  return (
    <div ref={canvasRef} className="preview-canvas sdk-demo-canvas">
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block' }}
        camera={{ position: [0, 1.35, CAMERA_DISTANCE], fov: DEFAULT_FOV }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#0a0f1a']} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 6, 2]} intensity={1.25} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <circleGeometry args={[6, 48]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <SdkDemoModel {...props} fovRef={fovRef} />
      </Canvas>
      <div className="sdk-demo-view-controls" aria-label="表示倍率">
        <button type="button" className="btn-secondary btn-sm" onClick={() => adjustZoom(3)} title="縮小">
          −
        </button>
        <button type="button" className="btn-secondary btn-sm" onClick={resetZoom} title="倍率リセット">
          100%
        </button>
        <button type="button" className="btn-secondary btn-sm" onClick={() => adjustZoom(-3)} title="拡大">
          ＋
        </button>
      </div>
      <p className="sdk-demo-controls-hint" aria-hidden>
        スクロール: 拡大・縮小 · WASD / 矢印: 移動 · Shift: 走る · Space: ジャンプ
      </p>
    </div>
  );
}
