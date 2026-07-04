'use client';

import { memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { AvatarBodyType } from '@ams/shared-types';
import { AvatarModel } from './avatar-model';
import { PreviewFrame } from './preview-frame';
import { PreviewOrbitControls } from './preview-orbit-controls';
import type { ResolvedPart } from './resolve-parts';

export interface AvatarPreviewProps {
  bodyType: AvatarBodyType;
  parts: ResolvedPart[];
  className?: string;
  showControlsHint?: boolean;
}

function AvatarPreviewInner({
  bodyType,
  parts,
  className,
  showControlsHint = true,
}: AvatarPreviewProps) {
  const previewMetas = parts.map((p) => p.preview);

  return (
    <PreviewFrame className={className} showControlsHint={showControlsHint}>
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block' }}
        camera={{ position: [0, 1.2, 2.8], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'default' }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#0a0f1a']} />
        <ambientLight intensity={0.55} />
        <hemisphereLight args={['#ffffff', '#444444', 0.6]} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} />
        <directionalLight position={[-2, 3, -2]} intensity={0.4} />
        <AvatarModel
          bodyType={bodyType as 'humanoid_vrm' | 'biped_mascot'}
          parts={previewMetas}
          partKeys={parts.map((p) => p.category)}
        />
        <PreviewOrbitControls />
      </Canvas>
    </PreviewFrame>
  );
}

export const AvatarPreview = memo(AvatarPreviewInner);
