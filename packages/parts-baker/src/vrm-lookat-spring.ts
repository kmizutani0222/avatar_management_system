import type { GltfJson, GltfNode } from './vrm-extension.types';

const HEAD_MESH_NAME = 'AMS_Head';

/** VRM humanoid bone node names — never treated as spring joints. */
const HUMANOID_BONE_NAMES = new Set([
  'hips', 'spine', 'chest', 'neck', 'head',
  'leftShoulder', 'leftUpperArm', 'leftLowerArm', 'leftHand',
  'rightShoulder', 'rightUpperArm', 'rightLowerArm', 'rightHand',
  'leftUpperLeg', 'leftLowerLeg', 'leftFoot',
  'rightUpperLeg', 'rightLowerLeg', 'rightFoot',
]);

interface LookAtRangeMap {
  inputMaxValue: number;
  outputScale: number;
}

interface SpringJointConfig {
  nodeIndex: number;
  stiffness: number;
  dragForce: number;
  gravityPower: number;
}

/** VRM 1.0 bone LookAt — head bone rotates toward the target. */
export function buildLookAtExtension(): {
  type: 'bone';
  offsetFromHeadBone: [number, number, number];
  rangeMapHorizontalInner: LookAtRangeMap;
  rangeMapHorizontalOuter: LookAtRangeMap;
  rangeMapVerticalDown: LookAtRangeMap;
  rangeMapVerticalUp: LookAtRangeMap;
} {
  const range = { inputMaxValue: 90, outputScale: 0.7 };
  return {
    type: 'bone',
    offsetFromHeadBone: [0, 0.06, 0.08],
    rangeMapHorizontalInner: range,
    rangeMapHorizontalOuter: range,
    rangeMapVerticalDown: range,
    rangeMapVerticalUp: range,
  };
}

/** Collect accessory wrapper nodes parented under a bone (excluding meshes and child bones). */
export function listAccessoryNodesUnderBone(nodes: GltfNode[], boneNodeIndex: number): number[] {
  const bone = nodes[boneNodeIndex];
  if (!bone?.children?.length) return [];
  return bone.children.filter((childIndex) => {
    const name = nodes[childIndex]?.name;
    if (!name) return false;
    if (name === HEAD_MESH_NAME || name.startsWith('AMS_')) return false;
    return !HUMANOID_BONE_NAMES.has(name);
  });
}

function collectSpringJoints(
  json: GltfJson,
  boneNodeIndex: number,
  config: Omit<SpringJointConfig, 'nodeIndex'>,
): SpringJointConfig[] {
  return listAccessoryNodesUnderBone(json.nodes ?? [], boneNodeIndex).map((nodeIndex) => ({
    nodeIndex,
    ...config,
  }));
}

/**
 * VRM 1.0 SpringBone — hair (head) and back accessories (chest) get physics sway.
 * Sphere colliders on head/chest prevent clipping.
 */
export function buildSpringBoneExtension(
  json: GltfJson,
  headBoneNodeIndex: number,
  chestBoneNodeIndex?: number,
): Record<string, unknown> | null {
  const nodes = json.nodes ?? [];
  if (!nodes[headBoneNodeIndex]) return null;

  const joints: SpringJointConfig[] = [
    ...collectSpringJoints(json, headBoneNodeIndex, {
      stiffness: 0.45,
      dragForce: 0.4,
      gravityPower: 0.15,
    }),
  ];

  if (chestBoneNodeIndex !== undefined && nodes[chestBoneNodeIndex]) {
    joints.push(
      ...collectSpringJoints(json, chestBoneNodeIndex, {
        stiffness: 0.32,
        dragForce: 0.55,
        gravityPower: 0.2,
      }),
    );
  }

  if (joints.length === 0) return null;

  const colliders: Array<{
    node: number;
    shape: { sphere: { offset: [number, number, number]; radius: number } };
  }> = [
    {
      node: headBoneNodeIndex,
      shape: {
        sphere: { offset: [0, 0.08, 0.02] as [number, number, number], radius: 0.11 },
      },
    },
  ];

  if (chestBoneNodeIndex !== undefined && nodes[chestBoneNodeIndex]) {
    colliders.push({
      node: chestBoneNodeIndex,
      shape: {
        sphere: { offset: [0, 0.05, -0.08] as [number, number, number], radius: 0.14 },
      },
    });
  }

  return {
    specVersion: '1.0',
    colliders,
    colliderGroups: [{ colliders: colliders.map((_, index) => index) }],
    joints: joints.map(({ nodeIndex, stiffness, dragForce, gravityPower }) => ({
      node: nodeIndex,
      hitRadius: 0.02,
      dragForce,
      gravityPower,
      gravityDir: [0, -1, 0] as [number, number, number],
      stiffness,
      colliderGroups: [0],
    })),
  };
}
