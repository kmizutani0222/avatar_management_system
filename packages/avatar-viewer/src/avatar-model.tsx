'use client';

import { AvatarBodyType, type PartPreviewMeta } from '@ams/shared-types';
import { PartMesh } from './part-mesh';
import { HUMANOID_BASE, MASCOT_BASE, QUADRUPED_BASE } from './types';

function HumanoidBase() {
  const { skinColor, bodyColor } = HUMANOID_BASE;
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

function MascotBase() {
  const { bodyColor, headColor } = MASCOT_BASE;
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

function QuadrupedBase() {
  const { bodyColor, headColor, legColor } = QUADRUPED_BASE;
  return (
    <group>
      <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.18, 0.55, 8, 16]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0, 0.55, 0.42]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={headColor} />
      </mesh>
      {(
        [
          [-0.22, 0.28],
          [0.22, 0.28],
          [-0.22, -0.28],
          [0.22, -0.28],
        ] as const
      ).map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.2, z]}>
          <capsuleGeometry args={[0.06, 0.28, 6, 12]} />
          <meshStandardMaterial color={legColor} />
        </mesh>
      ))}
      <mesh position={[0, 0.48, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.05, 0.12, 6, 12]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
    </group>
  );
}

export interface AvatarModelProps {
  bodyType: AvatarBodyType;
  parts: PartPreviewMeta[];
  partKeys?: string[];
}

/** Fallback procedural base when base-template GLB is unavailable. */
export function AvatarModel({ bodyType, parts, partKeys }: AvatarModelProps) {
  return (
    <group>
      {bodyType === AvatarBodyType.HUMANOID_VRM && <HumanoidBase />}
      {bodyType === AvatarBodyType.BIPED_MASCOT && <MascotBase />}
      {bodyType === AvatarBodyType.QUADRUPED && <QuadrupedBase />}
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
