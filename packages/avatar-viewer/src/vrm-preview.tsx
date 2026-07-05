'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm';
import type { VrmEditorMetadata } from '@ams/shared-types';
import type { Group } from 'three';
import { PreviewFrame } from './preview-frame';
import { PreviewOrbitControls } from './preview-orbit-controls';

export interface VrmPreviewProps {
  /** Blob URL, object URL, or authenticated API URL (use loadVrmFromAuth for API) */
  url: string;
  /** Optional Authorization header value e.g. "Bearer xxx" */
  authHeader?: string;
  editorMetadata?: VrmEditorMetadata | null;
  className?: string;
  showControlsHint?: boolean;
  interactive?: boolean;
}

function applyEditorMetadata(vrm: VRM, metadata?: VrmEditorMetadata | null) {
  if (!metadata?.blendShapes || !vrm.expressionManager) return;
  for (const [name, value] of Object.entries(metadata.blendShapes)) {
    vrm.expressionManager.setValue(name, value);
  }
  vrm.expressionManager.update();
}

function VrmModel({
  url,
  authHeader,
  editorMetadata,
}: {
  url: string;
  authHeader?: string;
  editorMetadata?: VrmEditorMetadata | null;
}) {
  const rootRef = useRef<Group>(null);
  const vrmRef = useRef<VRM | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revoked: string | null = null;
    let disposed = false;

    async function load() {
      try {
        let loadUrl = url;
        if (authHeader) {
          const res = await fetch(url, { headers: { Authorization: authHeader } });
          if (!res.ok) throw new Error('Failed to fetch VRM model');
          const blob = await res.blob();
          loadUrl = URL.createObjectURL(blob);
          revoked = loadUrl;
        }

        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        loader.load(
          loadUrl,
          (gltf) => {
            if (disposed) return;
            const vrm = gltf.userData.vrm as VRM | undefined;
            if (!vrm) {
              setError('Not a valid VRM file');
              return;
            }
            VRMUtils.removeUnnecessaryVertices(gltf.scene);
            VRMUtils.combineSkeletons(gltf.scene);
            vrm.scene.rotation.y = Math.PI;
            vrmRef.current = vrm;
            if (rootRef.current) {
              rootRef.current.clear();
              rootRef.current.add(vrm.scene);
            }
            applyEditorMetadata(vrm, editorMetadata);
          },
          undefined,
          () => setError('VRM load failed'),
        );
      } catch {
        if (!disposed) setError('VRM load failed');
      }
    }

    load();

    return () => {
      disposed = true;
      if (revoked) URL.revokeObjectURL(revoked);
      vrmRef.current?.scene.removeFromParent();
      vrmRef.current = null;
    };
  }, [url, authHeader]);

  useEffect(() => {
    if (vrmRef.current) applyEditorMetadata(vrmRef.current, editorMetadata);
  }, [editorMetadata]);

  useFrame((_, delta) => {
    vrmRef.current?.update(delta);
  });

  if (error) return null;

  return <group ref={rootRef} position={[0, -0.5, 0]} />;
}

function VrmPreviewInner({
  url,
  authHeader,
  editorMetadata,
  className,
  showControlsHint = true,
  interactive = true,
}: VrmPreviewProps) {
  return (
    <PreviewFrame className={className} showControlsHint={showControlsHint}>
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block' }}
        camera={{ position: [0, 1.2, 2.5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#0a0f1a']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <VrmModel url={url} authHeader={authHeader} editorMetadata={editorMetadata} />
        {interactive && <PreviewOrbitControls />}
      </Canvas>
    </PreviewFrame>
  );
}

export const VrmPreview = memo(VrmPreviewInner);

/** Extract expression names from a loaded VRM file (client-side, before upload) */
export async function extractVrmExpressionNames(file: File): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm as VRM | undefined;
          const names =
            vrm?.expressionManager?.expressions.map((e) => e.expressionName) ?? [];
          resolve(names);
        },
        undefined,
        reject,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export { applyEditorMetadata };
