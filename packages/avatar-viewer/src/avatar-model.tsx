'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { PartPreviewMeta } from '@ams/shared-types';
import { getAttachPosition } from './types';

interface PartMeshProps {
  preview: PartPreviewMeta;
}

function PartMesh({ preview }: PartMeshProps) {
  const ref = useRef<Mesh>(null);
  const [ax, ay, az] = getAttachPosition(preview.attachTo);
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

interface HumanoidBaseProps {
  skinColor: string;
  bodyColor: string;
}

function HumanoidBase({ skinColor, bodyColor }: HumanoidBaseProps) {
  return (
    <group>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.2, 0.5, 8, 16]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[-0.35, 0.95, 0]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.06, 0.35, 6, 12]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.35, 0.95, 0]} rotation={[0, 0, -0.3]}>
        <capsuleGeometry args={[0.06, 0.35, 6, 12]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[-0.12, 0.35, 0]}>
        <capsuleGeometry args={[0.07, 0.45, 6, 12]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0.12, 0.35, 0]}>
        <capsuleGeometry args={[0.07, 0.45, 6, 12]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
    </group>
  );
}

interface MascotBaseProps {
  bodyColor: string;
  headColor: string;
}

function MascotBase({ bodyColor, headColor }: MascotBaseProps) {
  return (
    <group>
      <mesh position={[0, 0.75, 0]} scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[0.35, 20, 20]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={headColor} />
      </mesh>
      <mesh position={[-0.15, 0.25, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.15, 0.25, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
    </group>
  );
}

export interface AvatarModelProps {
  bodyType: 'humanoid_vrm' | 'biped_mascot';
  parts: PartPreviewMeta[];
  partKeys?: string[];
}

export function AvatarModel({ bodyType, parts, partKeys }: AvatarModelProps) {
  return (
    <group>
      {bodyType === 'humanoid_vrm' ? (
        <HumanoidBase skinColor="#f5d0a9" bodyColor="#4a90d9" />
      ) : (
        <MascotBase bodyColor="#ffb347" headColor="#ffcc80" />
      )}
      {parts.map((preview, i) => (
        <PartMesh key={partKeys?.[i] ?? `${preview.attachTo}-${i}`} preview={preview} />
      ))}
    </group>
  );
}
