import type { GltfJson, GltfNode } from './vrm-extension.types';

const HEAD_MESH_NAME = 'AMS_Head';

interface LookAtRangeMap {
  inputMaxValue: number;
  outputScale: number;
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

/**
 * VRM 1.0 SpringBone — hair/accessory nodes parented under the head bone get
 * physics sway. A sphere collider on the head prevents clipping.
 */
export function buildSpringBoneExtension(
  json: GltfJson,
  headBoneNodeIndex: number,
): Record<string, unknown> | null {
  const nodes = json.nodes ?? [];
  const headBone = nodes[headBoneNodeIndex];
  if (!headBone) return null;

  const jointNodeIndices = (headBone.children ?? []).filter(
    (childIndex) => nodes[childIndex]?.name !== HEAD_MESH_NAME,
  );
  if (jointNodeIndices.length === 0) return null;

  return {
    specVersion: '1.0',
    colliders: [
      {
        node: headBoneNodeIndex,
        shape: {
          sphere: { offset: [0, 0.08, 0.02] as [number, number, number], radius: 0.11 },
        },
      },
    ],
    colliderGroups: [{ colliders: [0] }],
    joints: jointNodeIndices.map((nodeIndex) => ({
      node: nodeIndex,
      hitRadius: 0.02,
      dragForce: 0.4,
      gravityPower: 0.15,
      gravityDir: [0, -1, 0] as [number, number, number],
      stiffness: 0.45,
      colliderGroups: [0],
    })),
  };
}

/** Collect accessory node indices parented under a bone (excluding the head mesh). */
export function listAccessoryNodesUnderBone(nodes: GltfNode[], boneNodeIndex: number): number[] {
  const bone = nodes[boneNodeIndex];
  if (!bone?.children?.length) return [];
  return bone.children.filter((childIndex) => nodes[childIndex]?.name !== HEAD_MESH_NAME);
}
