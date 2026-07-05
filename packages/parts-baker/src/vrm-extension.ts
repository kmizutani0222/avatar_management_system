const GLB_MAGIC = 0x46546c67; // 'glTF'
const CHUNK_JSON = 0x4e4f534a; // 'JSON'

import { buildLookAtExtension, buildSpringBoneExtension } from './vrm-lookat-spring';
import type { GltfJson, MorphTargetBind } from './vrm-extension.types';

export type { GltfJson, GltfNode, GltfMesh } from './vrm-extension.types';

/** VRM 1.0 humanoid bones we emit (superset of the required set). */
const VRM_HUMAN_BONES = [
  'hips',
  'spine',
  'chest',
  'neck',
  'head',
  'leftShoulder',
  'leftUpperArm',
  'leftLowerArm',
  'leftHand',
  'rightShoulder',
  'rightUpperArm',
  'rightLowerArm',
  'rightHand',
  'leftUpperLeg',
  'leftLowerLeg',
  'leftFoot',
  'rightUpperLeg',
  'rightLowerLeg',
  'rightFoot',
] as const;

export const REQUIRED_VRM_BONES = [
  'hips',
  'spine',
  'head',
  'leftUpperArm',
  'leftLowerArm',
  'leftHand',
  'rightUpperArm',
  'rightLowerArm',
  'rightHand',
  'leftUpperLeg',
  'leftLowerLeg',
  'leftFoot',
  'rightUpperLeg',
  'rightLowerLeg',
  'rightFoot',
] as const;

function parseGlbJson(glb: Buffer): GltfJson {
  if (glb.length < 20 || glb.readUInt32LE(0) !== GLB_MAGIC) {
    throw new Error('Not a valid GLB buffer');
  }
  const jsonLength = glb.readUInt32LE(12);
  if (glb.readUInt32LE(16) !== CHUNK_JSON) {
    throw new Error('First GLB chunk is not JSON');
  }
  return JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8')) as GltfJson;
}

/** Return VRM humanoid bone names that are missing from the GLB node list. */
export function findMissingVrmBones(glb: Buffer): string[] {
  const json = parseGlbJson(glb);
  const nodes = json.nodes ?? [];
  const humanBones: Record<string, { node: number }> = {};
  for (const boneName of VRM_HUMAN_BONES) {
    const index = nodes.findIndex((node) => node.name === boneName);
    if (index >= 0) humanBones[boneName] = { node: index };
  }
  return REQUIRED_VRM_BONES.filter((boneName) => !(boneName in humanBones));
}

const HEAD_MESH_NAME = 'AMS_Head';

function findHeadMeshNode(json: GltfJson): { nodeIndex: number; meshIndex: number } | null {
  const nodes = json.nodes ?? [];
  const meshes = json.meshes ?? [];

  const byName = nodes.findIndex((node) => node.name === HEAD_MESH_NAME);
  if (byName >= 0 && nodes[byName].mesh !== undefined) {
    return { nodeIndex: byName, meshIndex: nodes[byName].mesh! };
  }

  const meshIndex = meshes.findIndex((mesh) => mesh.name === HEAD_MESH_NAME);
  if (meshIndex >= 0) {
    const nodeIndex = nodes.findIndex((node) => node.mesh === meshIndex);
    if (nodeIndex >= 0) return { nodeIndex, meshIndex };
  }

  return null;
}

function buildExpressionPresets(json: GltfJson): Record<string, { morphTargetBinds: MorphTargetBind[] }> {
  const head = findHeadMeshNode(json);
  if (!head) return {};

  const mesh = json.meshes?.[head.meshIndex];
  const targetNames = mesh?.extras?.targetNames;
  if (!targetNames?.length) return {};

  const preset: Record<string, { morphTargetBinds: MorphTargetBind[] }> = {};
  for (let index = 0; index < targetNames.length; index++) {
    const exprName = targetNames[index];
    if (!exprName) continue;
    preset[exprName] = {
      morphTargetBinds: [{ node: head.nodeIndex, index, weight: 1.0 }],
    };
  }

  return preset;
}

/**
 * Inject VRMC_vrm 1.0 (+ optional VRMC_springBone) into a GLB JSON chunk.
 */
export function injectVrm10Extension(glb: Buffer, name: string): Buffer {
  const jsonLength = glb.readUInt32LE(12);
  const json = parseGlbJson(glb);
  const remainingChunks = glb.subarray(20 + jsonLength);

  const nodes = json.nodes ?? [];
  const humanBones: Record<string, { node: number }> = {};
  for (const boneName of VRM_HUMAN_BONES) {
    const index = nodes.findIndex((node) => node.name === boneName);
    if (index >= 0) humanBones[boneName] = { node: index };
  }

  const missing = findMissingVrmBones(glb);
  if (missing.length > 0) {
    throw new Error(`GLB is missing required VRM bones: ${missing.join(', ')}`);
  }

  const expressionPresets = buildExpressionPresets(json);
  const headBoneNodeIndex = humanBones.head!.node;
  const chestBoneNodeIndex = humanBones.chest?.node;
  const lookAt = buildLookAtExtension();
  const springBone = buildSpringBoneExtension(json, headBoneNodeIndex, chestBoneNodeIndex);

  const extensionsUsed = new Set([...(json.extensionsUsed ?? []), 'VRMC_vrm']);
  if (springBone) extensionsUsed.add('VRMC_springBone');

  json.asset = { ...(json.asset ?? { version: '2.0' }), generator: 'AMS Parts Baker' };
  json.extensionsUsed = Array.from(extensionsUsed);
  json.extensions = {
    ...(json.extensions ?? {}),
    VRMC_vrm: {
      specVersion: '1.0',
      meta: {
        name,
        version: '1.0',
        authors: ['AMS'],
        licenseUrl: 'https://vrm.dev/licenses/1.0/',
        avatarPermission: 'onlyAuthor',
        allowExcessivelyViolentUsage: false,
        allowExcessivelySexualUsage: false,
        commercialUsage: 'personalNonProfit',
        allowPoliticalOrReligiousUsage: false,
        allowAntisocialOrHateUsage: false,
        creditNotation: 'required',
        allowRedistribution: false,
        modification: 'prohibited',
      },
      humanoid: { humanBones },
      lookAt,
      ...(Object.keys(expressionPresets).length > 0
        ? { expressions: { preset: expressionPresets } }
        : {}),
    },
    ...(springBone ? { VRMC_springBone: springBone } : {}),
  };

  let jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const padding = (4 - (jsonBuffer.length % 4)) % 4;
  if (padding > 0) {
    jsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc(padding, 0x20)]);
  }

  const header = Buffer.alloc(20);
  header.writeUInt32LE(GLB_MAGIC, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + jsonBuffer.length + remainingChunks.length, 8);
  header.writeUInt32LE(jsonBuffer.length, 12);
  header.writeUInt32LE(CHUNK_JSON, 16);

  return Buffer.concat([header, jsonBuffer, remainingChunks]);
}
