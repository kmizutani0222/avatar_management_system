'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { AvatarBodyType, type PartPreviewMeta } from '@ams/shared-types';
import { getAttachPosition } from './types';

export interface PartMeshProps {
  bodyType: AvatarBodyType;
  preview: PartPreviewMeta;
}

export function PartMesh({ bodyType, preview }: PartMeshProps) {
  const ref = useRef<Mesh>(null);
  const [ax, ay, az] = getAttachPosition(preview.attachTo, bodyType);
  const [ox, oy, oz] = preview.offset;
  const [sx, sy, sz] = preview.scale;

  useFrame((_, delta) => {
    if (ref.current && preview.attachTo === 'back') {
      ref.current.rotation.y += delta * 0.5;
    }
  });

  const position: [number, number, number] = [ax + ox, ay + oy, az + oz];

  if (preview.geometry === 'sphere') {
    return (
      <mesh ref={ref} position={position} scale={[sx, sy, sz]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={preview.color} />
      </mesh>
    );
  }

  if (preview.geometry === 'capsule') {
    return (
      <mesh ref={ref} position={position} scale={[sx, sy, sz]}>
        <capsuleGeometry args={[0.15, 0.4, 8, 16]} />
        <meshStandardMaterial color={preview.color} />
      </mesh>
    );
  }

  if (preview.geometry === 'cylinder') {
    return (
      <mesh ref={ref} position={position} scale={[sx, sy, sz]}>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 12]} />
        <meshStandardMaterial color={preview.color} />
      </mesh>
    );
  }

  return (
    <mesh ref={ref} position={position} scale={[sx, sy, sz]}>
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshStandardMaterial color={preview.color} />
    </mesh>
  );
}
