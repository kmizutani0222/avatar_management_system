import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ExpressionMorphSettings } from '@ams/shared-types';
import { HUMANOID_BASE } from './attach-points';
import { HUMANOID_BONE_WORLD } from './humanoid-rig';
import { createExpressionHeadMesh } from './expression-morphs';

/** Parent bone of each VRM humanoid bone (null = scene root). */
export const HUMANOID_BONE_PARENT: Record<string, string | null> = {
  hips: null,
  spine: 'hips',
  chest: 'spine',
  neck: 'chest',
  head: 'neck',
  leftShoulder: 'chest',
  leftUpperArm: 'leftShoulder',
  leftLowerArm: 'leftUpperArm',
  leftHand: 'leftLowerArm',
  rightShoulder: 'chest',
  rightUpperArm: 'rightShoulder',
  rightLowerArm: 'rightUpperArm',
  rightHand: 'rightLowerArm',
  leftUpperLeg: 'hips',
  leftLowerLeg: 'leftUpperLeg',
  leftFoot: 'leftLowerLeg',
  rightUpperLeg: 'hips',
  rightLowerLeg: 'rightUpperLeg',
  rightFoot: 'rightLowerLeg',
};

const BONE_ORDER = Object.keys(HUMANOID_BONE_PARENT);

interface BodySegment {
  geometry: THREE.BufferGeometry;
  bone: string;
  material: 'skin' | 'body';
  /** Vertices within this distance of the bone origin blend toward the parent bone. */
  blendRadius: number;
}

function capsule(r: number, len: number): THREE.BufferGeometry {
  return new THREE.CapsuleGeometry(r, len, 6, 12);
}

/** Geometry positioned in world space so skin weights can use world distances. */
function placed(
  geometry: THREE.BufferGeometry,
  bone: string,
  offset: [number, number, number],
  rotateZ = 0,
): THREE.BufferGeometry {
  const [bx, by, bz] = HUMANOID_BONE_WORLD[bone];
  if (rotateZ !== 0) geometry.rotateZ(rotateZ);
  geometry.translate(bx + offset[0], by + offset[1], bz + offset[2]);
  return geometry;
}

function buildSegments(): BodySegment[] {
  const HALF_PI = Math.PI / 2;
  const segments: BodySegment[] = [
    { geometry: placed(capsule(0.2, 0.5), 'spine', [0, 0.05, 0]), bone: 'spine', material: 'body', blendRadius: 0.14 },
  ];

  for (const side of ['left', 'right'] as const) {
    const sign = side === 'left' ? 1 : -1;
    segments.push(
      {
        geometry: placed(capsule(0.06, 0.2), `${side}UpperArm`, [sign * 0.12, 0, 0], HALF_PI),
        bone: `${side}UpperArm`,
        material: 'body',
        blendRadius: 0.08,
      },
      {
        geometry: placed(capsule(0.06, 0.2), `${side}LowerArm`, [sign * 0.11, 0, 0], HALF_PI),
        bone: `${side}LowerArm`,
        material: 'body',
        blendRadius: 0.08,
      },
      {
        geometry: placed(new THREE.SphereGeometry(0.05, 8, 8), `${side}Hand`, [0, 0, 0]),
        bone: `${side}Hand`,
        material: 'skin',
        blendRadius: 0.05,
      },
      {
        geometry: placed(capsule(0.07, 0.2), `${side}UpperLeg`, [0, -0.15, 0]),
        bone: `${side}UpperLeg`,
        material: 'skin',
        blendRadius: 0.09,
      },
      {
        geometry: placed(capsule(0.07, 0.2), `${side}LowerLeg`, [0, -0.14, 0]),
        bone: `${side}LowerLeg`,
        material: 'skin',
        blendRadius: 0.09,
      },
      {
        geometry: placed(new THREE.BoxGeometry(0.1, 0.06, 0.2), `${side}Foot`, [0, -0.03, 0.04]),
        bone: `${side}Foot`,
        material: 'skin',
        blendRadius: 0.05,
      },
    );
  }

  return segments;
}

/**
 * Assign 2-bone skin weights: full weight on the segment bone, blending
 * toward the parent bone for vertices near the joint (bone origin).
 */
function assignSkinAttributes(segment: BodySegment): void {
  const { geometry, bone, blendRadius } = segment;
  const boneIndex = BONE_ORDER.indexOf(bone);
  const parentName = HUMANOID_BONE_PARENT[bone];
  const parentIndex = parentName ? BONE_ORDER.indexOf(parentName) : -1;
  const joint = new THREE.Vector3(...HUMANOID_BONE_WORLD[bone]);

  const position = geometry.attributes.position as THREE.BufferAttribute;
  const count = position.count;
  const skinIndices = new Uint16Array(count * 4);
  const skinWeights = new Float32Array(count * 4);
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(position, i);
    let parentWeight = 0;
    if (parentIndex >= 0 && blendRadius > 0) {
      const d = v.distanceTo(joint);
      if (d < blendRadius) {
        parentWeight = 0.5 * (1 - d / blendRadius);
      }
    }
    skinIndices[i * 4] = boneIndex;
    skinWeights[i * 4] = 1 - parentWeight;
    skinIndices[i * 4 + 1] = parentIndex >= 0 ? parentIndex : boneIndex;
    skinWeights[i * 4 + 1] = parentWeight;
  }

  geometry.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeights, 4));
}

function createBone(name: string, parent: THREE.Object3D): THREE.Bone {
  const bone = new THREE.Bone();
  bone.name = name;
  const [wx, wy, wz] = HUMANOID_BONE_WORLD[name];
  const parentWorld = new THREE.Vector3();
  parent.getWorldPosition(parentWorld);
  bone.position.set(wx - parentWorld.x, wy - parentWorld.y, wz - parentWorld.z);
  parent.add(bone);
  bone.updateMatrixWorld(true);
  return bone;
}

/**
 * Skinned humanoid base: VRM bone hierarchy (THREE.Bone) driving two
 * SkinnedMeshes (skin/body materials) with per-vertex weights blended at
 * joints. The expression-morph head stays a rigid child of the head bone.
 */
export function buildSkinnedHumanoidScene(
  expressionSettings?: ExpressionMorphSettings,
): THREE.Scene {
  const scene = new THREE.Scene();

  const bones: Record<string, THREE.Bone> = {};
  for (const name of BONE_ORDER) {
    const parentName = HUMANOID_BONE_PARENT[name];
    bones[name] = createBone(name, parentName ? bones[parentName] : scene);
  }
  scene.updateMatrixWorld(true);

  const skeleton = new THREE.Skeleton(BONE_ORDER.map((name) => bones[name]));

  const segments = buildSegments();
  for (const segment of segments) {
    assignSkinAttributes(segment);
  }

  const byMaterial: Record<'skin' | 'body', THREE.BufferGeometry[]> = { skin: [], body: [] };
  for (const segment of segments) {
    byMaterial[segment.material].push(segment.geometry);
  }

  const materials = {
    skin: new THREE.MeshStandardMaterial({ color: new THREE.Color(HUMANOID_BASE.skinColor) }),
    body: new THREE.MeshStandardMaterial({ color: new THREE.Color(HUMANOID_BASE.bodyColor) }),
  };

  for (const key of ['skin', 'body'] as const) {
    const merged = mergeGeometries(byMaterial[key], false);
    if (!merged) throw new Error('Failed to merge humanoid body geometries');
    const mesh = new THREE.SkinnedMesh(merged, materials[key]);
    mesh.name = key === 'skin' ? 'AMS_BodySkin' : 'AMS_BodyMain';
    scene.add(mesh);
    mesh.bind(skeleton);
  }

  bones.head.add(createExpressionHeadMesh(materials.skin.clone(), expressionSettings));

  return scene;
}
