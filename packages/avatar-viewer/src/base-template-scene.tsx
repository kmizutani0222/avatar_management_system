'use client';

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkinnedScene } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { AvatarBodyType, type PartPreviewMeta } from '@ams/shared-types';
import { PartMesh } from './part-mesh';

export interface BaseTemplateSceneProps {
  url: string;
  bodyType: AvatarBodyType;
  parts: PartPreviewMeta[];
  partKeys?: string[];
}

/** Load server base-template GLB and overlay procedural part meshes. */
export function BaseTemplateScene({ url, bodyType, parts, partKeys }: BaseTemplateSceneProps) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => {
    const copy = cloneSkinnedScene(scene);
    copy.traverse((obj) => {
      const mesh = obj as typeof obj & { isMesh?: boolean };
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return copy;
  }, [scene]);

  return (
    <group>
      <primitive object={cloned} />
      {parts.map((preview, i) => (
        <PartMesh
          key={partKeys?.[i] ?? `${preview.attachTo}-${i}`}
          bodyType={bodyType}
          preview={preview}
        />
      ))}
    </group>
  );
}
