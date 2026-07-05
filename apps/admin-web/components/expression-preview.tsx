'use client';

import { useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createExpressionHeadGeometry,
  VRM_EXPRESSION_PRESETS,
  type VrmExpressionPreset,
} from '@ams/parts-baker/expression-morphs';
import type { ExpressionMorphSettings } from '@ams/shared-types';

interface HeadProps {
  settings: ExpressionMorphSettings;
  activeExpression: VrmExpressionPreset;
  weight: number;
}

function MorphHead({ settings, activeExpression, weight }: HeadProps) {
  // Settings changes rebuild the geometry so all 13 morphs reflect current scales.
  const settingsKey = JSON.stringify(settings);
  const mesh = useMemo(() => {
    const geometry = createExpressionHeadGeometry(0.22, 32, settings);
    const material = new THREE.MeshStandardMaterial({ color: '#f5d0a9' });
    const head = new THREE.Mesh(geometry, material);
    head.morphTargetInfluences = new Array(VRM_EXPRESSION_PRESETS.length).fill(0);
    return head;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsKey]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    },
    [mesh],
  );

  useEffect(() => {
    const influences = mesh.morphTargetInfluences;
    if (!influences) return;
    influences.fill(0);
    const index = VRM_EXPRESSION_PRESETS.indexOf(activeExpression);
    if (index >= 0) influences[index] = weight;
  }, [mesh, activeExpression, weight]);

  useFrame(({ clock }) => {
    mesh.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.45;
  });

  return <primitive object={mesh} scale={[3.4, 3.4, 3.4]} />;
}

export interface ExpressionPreviewProps extends HeadProps {
  className?: string;
}

export default function ExpressionPreview({
  settings,
  activeExpression,
  weight,
  className,
}: ExpressionPreviewProps) {
  return (
    <div className={className} style={{ width: '100%', height: 320 }}>
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block', borderRadius: 8 }}
        camera={{ position: [0, 0.1, 2.2], fov: 40 }}
        gl={{ antialias: true, powerPreference: 'default' }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#0f172a']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 4]} intensity={1.2} />
        <directionalLight position={[-2, 1, -2]} intensity={0.4} />
        <MorphHead settings={settings} activeExpression={activeExpression} weight={weight} />
      </Canvas>
    </div>
  );
}
