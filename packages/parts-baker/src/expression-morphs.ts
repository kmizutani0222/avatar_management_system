import * as THREE from 'three';
import {
  DEFAULT_EXPRESSION_MORPH_SETTINGS,
  type ExpressionMorphSettings,
} from '@ams/shared-types';

/** VRM 1.0 preset expression names supported by AMS procedural avatars. */
export const VRM_EXPRESSION_PRESETS = [
  'happy',
  'angry',
  'sad',
  'relaxed',
  'surprised',
  'aa',
  'ih',
  'ou',
  'ee',
  'oh',
  'blink',
  'blinkLeft',
  'blinkRight',
] as const;

export type VrmExpressionPreset = (typeof VRM_EXPRESSION_PRESETS)[number];

function initMorph(count: number): Float32Array {
  return new Float32Array(count * 3);
}

function addDelta(morph: Float32Array, i: number, dx: number, dy: number, dz: number): void {
  morph[i * 3] += dx;
  morph[i * 3 + 1] += dy;
  morph[i * 3 + 2] += dz;
}

/**
 * Sphere head geometry with VRM 1.0 preset morph targets.
 * Mesh should be named `AMS_Head` so the VRM extension can bind expressions.
 */
export function createExpressionHeadGeometry(
  radius = 0.22,
  segments = 16,
  settings: ExpressionMorphSettings = DEFAULT_EXPRESSION_MORPH_SETTINGS,
): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(radius, segments, segments);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const count = position.count;

  const morphs: Record<VrmExpressionPreset, Float32Array> = {} as Record<
    VrmExpressionPreset,
    Float32Array
  >;
  for (const name of VRM_EXPRESSION_PRESETS) {
    morphs[name] = initMorph(count);
  }

  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(position, i);
    const { x, y, z } = v;

    const isMouth = y < radius * 0.25 && z > radius * 0.35;
    const isBrow = y > radius * 0.35 && z > radius * 0.1;
    const isEye = y > radius * 0.05 && y < radius * 0.55 && Math.abs(x) < radius * 0.75;

    if (isMouth) {
      addDelta(morphs.happy, i, x * 0.12 * settings.mouthScale, radius * 0.12 * settings.mouthScale, 0);
      addDelta(morphs.sad, i, 0, -radius * 0.1 * settings.mouthScale, 0);
      addDelta(morphs.aa, i, 0, -radius * 0.25 * settings.mouthScale, 0);
      addDelta(morphs.ih, i, x * 0.35 * settings.mouthScale, radius * 0.05 * settings.mouthScale, 0);
      addDelta(morphs.ou, i, x * 0.2 * settings.mouthScale, -radius * 0.08 * settings.mouthScale, z * 0.05 * settings.mouthScale);
      addDelta(morphs.ee, i, x * 0.15 * settings.mouthScale, radius * 0.08 * settings.mouthScale, 0);
      addDelta(morphs.oh, i, 0, -radius * 0.18 * settings.mouthScale, 0);
    }

    if (isBrow) {
      addDelta(morphs.angry, i, 0, -radius * 0.15 * settings.browScale, 0);
      addDelta(morphs.relaxed, i, 0, -radius * 0.04 * settings.browScale, 0);
      addDelta(morphs.surprised, i, 0, radius * 0.08 * settings.browScale, 0);
    }

    if (isEye) {
      addDelta(morphs.blink, i, 0, -radius * 0.35 * settings.eyeScale, 0);
      if (x < 0) addDelta(morphs.blinkLeft, i, 0, -radius * 0.35 * settings.eyeScale, 0);
      if (x > 0) addDelta(morphs.blinkRight, i, 0, -radius * 0.35 * settings.eyeScale, 0);
      addDelta(morphs.surprised, i, 0, radius * 0.06 * settings.eyeScale, 0);
    }

    if (y < 0 && z > radius * 0.4) {
      addDelta(morphs.surprised, i, 0, -radius * 0.2 * settings.browScale, 0);
    }
  }

  // Per-expression intensity (Phase 18) — scales the whole morph displacement.
  for (const name of VRM_EXPRESSION_PRESETS) {
    const intensity = settings.expressionIntensity?.[name];
    if (intensity === undefined || intensity === 1) continue;
    const morph = morphs[name];
    for (let i = 0; i < morph.length; i++) {
      morph[i] *= intensity;
    }
  }

  geometry.morphAttributes.position = VRM_EXPRESSION_PRESETS.map(
    (name) => new THREE.BufferAttribute(morphs[name], 3),
  );
  geometry.morphTargetsRelative = true;

  return geometry;
}

export function createExpressionHeadMesh(
  material: THREE.Material,
  settings: ExpressionMorphSettings = DEFAULT_EXPRESSION_MORPH_SETTINGS,
): THREE.Mesh {
  const mesh = new THREE.Mesh(createExpressionHeadGeometry(0.22, 16, settings), material);
  mesh.name = 'AMS_Head';
  mesh.morphTargetDictionary = {};
  VRM_EXPRESSION_PRESETS.forEach((name, index) => {
    mesh.morphTargetDictionary![name] = index;
  });
  mesh.morphTargetInfluences = new Array(VRM_EXPRESSION_PRESETS.length).fill(0);
  return mesh;
}
