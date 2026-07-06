'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, type RefObject } from 'react';
import type { Group, PerspectiveCamera } from 'three';
import { MathUtils, Vector3 } from 'three';
import AmsClient from '@ams/sdk-web';
import {
  applyExpressions,
  applyVrmRestPose,
  isLoadedGlb,
  isLoadedVrm,
  loadAmsModel,
  resolveVrmSceneRotationY,
  updateGlbRuntime,
  updateVrmRuntime,
  type ExpressionValues,
  type LoadedAmsModel,
} from '@ams/sdk-three';

const CAMERA_DISTANCE = 3.2;
const DEFAULT_FOV = 42;

function StaticCamera({ targetRef }: { targetRef: RefObject<Group | null> }) {
  const { camera } = useThree();
  const lookAt = useRef(new Vector3());
  const desiredPos = useRef(new Vector3());

  useFrame((_state, delta) => {
    const target = targetRef.current;
    if (!target) return;
    lookAt.current.set(target.position.x, target.position.y + 1.0, target.position.z);
    desiredPos.current.set(
      lookAt.current.x,
      lookAt.current.y + 0.35,
      lookAt.current.z + CAMERA_DISTANCE,
    );
    camera.position.lerp(desiredPos.current, 1 - Math.exp(-4 * delta));
    camera.lookAt(lookAt.current);
    const persp = camera as PerspectiveCamera;
    persp.fov = MathUtils.lerp(persp.fov, DEFAULT_FOV, 1 - Math.exp(-8 * delta));
    persp.updateProjectionMatrix();
  });

  return null;
}

function SandboxModel({
  client,
  avatarId,
  sourceType,
  expressions,
  onLoaded,
  onError,
}: {
  client: AmsClient;
  avatarId: string;
  sourceType?: string;
  expressions: ExpressionValues;
  onLoaded?: (info: { format: string; bytes: number }) => void;
  onError?: (message: string) => void;
}) {
  const rootRef = useRef<Group>(null);
  const modelRef = useRef<LoadedAmsModel | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    let disposed = false;
    modelRef.current?.dispose();
    modelRef.current = null;
    if (rootRef.current) {
      rootRef.current.position.set(0, -0.5, 0);
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
          loaded.vrm.scene.rotation.y = resolveVrmSceneRotationY({
            sourceType,
            assetGenerator: loaded.gltf.asset?.generator,
          });
          applyVrmRestPose(loaded.vrm);
          rootRef.current.add(loaded.vrm.scene);
        } else if (isLoadedGlb(loaded)) {
          rootRef.current.add(loaded.scene);
        }

        onLoaded?.({ format: isLoadedVrm(loaded) ? 'vrm' : 'glb', bytes: 0 });
      })
      .catch((error: unknown) => {
        onError?.(error instanceof Error ? error.message : 'モデルの読み込みに失敗しました');
      });

    return () => {
      disposed = true;
      modelRef.current?.dispose();
      modelRef.current = null;
      rootRef.current?.clear();
    };
  }, [client, avatarId, sourceType, onLoaded, onError]);

  useFrame((_, delta) => {
    const model = modelRef.current;
    if (!model) return;
    if (isLoadedVrm(model)) {
      updateVrmRuntime(model.vrm, delta, { expressions, lookAtTarget: camera });
    } else if (isLoadedGlb(model)) {
      updateGlbRuntime(model, delta, { sway: true });
    }
  });

  return (
    <>
      <group ref={rootRef} />
      <StaticCamera targetRef={rootRef} />
    </>
  );
}

export interface SandboxModelPreviewProps {
  client: AmsClient;
  avatarId: string;
  sourceType?: string;
  expressions?: ExpressionValues;
  onLoaded?: (info: { format: string; bytes: number }) => void;
  onError?: (message: string) => void;
}

export function SandboxModelPreview({
  client,
  avatarId,
  sourceType,
  expressions = {},
  onLoaded,
  onError,
}: SandboxModelPreviewProps) {
  return (
    <div className="sandbox-preview-canvas">
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block' }}
        camera={{ position: [0, 1.35, CAMERA_DISTANCE], fov: DEFAULT_FOV }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#0a0f1a']} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 6, 2]} intensity={1.25} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <circleGeometry args={[6, 48]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <SandboxModel
          client={client}
          avatarId={avatarId}
          sourceType={sourceType}
          expressions={expressions}
          onLoaded={onLoaded}
          onError={onError}
        />
      </Canvas>
    </div>
  );
}

/** Apply a named expression preset map to a VRM (for preview). */
export function presetToExpressions(preset: Record<string, number>): ExpressionValues {
  return { ...preset };
}
