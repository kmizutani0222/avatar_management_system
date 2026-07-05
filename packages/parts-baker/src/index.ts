import { AvatarBodyType, type ExpressionMorphSettings, type PartBakeMeta, type PartPreviewMeta } from '@ams/shared-types';
import { buildPartsScene } from './build-scene';
import { buildPartOnlyScene } from './build-part-scene';
import { exportSceneToGlb } from './export-glb';
import { ensureGltfExportPolyfills } from './node-polyfills';
import { mergeGlbParts, tagAsVrm, type MergePartInput } from './merge-glb';
import { getAttachPosition } from './attach-points';
import { bakeDefaultVrmThumbnail, bakePartsThumbnail } from './render-thumbnail';
import { ATTACH_TO_BONE, HUMANOID_BONE_WORLD, buildHumanoidRigScene } from './humanoid-rig';
import { buildSkinnedHumanoidScene } from './humanoid-skinned';
import { injectVrm10Extension } from './vrm-extension';

export { buildPartsScene } from './build-scene';
export { buildPartOnlyScene } from './build-part-scene';
export { exportSceneToGlb } from './export-glb';
export { mergeGlbParts, tagAsVrm } from './merge-glb';
export { bakePartsThumbnail, bakeDefaultVrmThumbnail } from './render-thumbnail';
export { resolvePartsFromSelections, parsePartMetadata } from './resolve-parts';
export type { ResolvedPart } from './resolve-parts';
export { buildHumanoidRigScene, HUMANOID_BONE_WORLD, ATTACH_TO_BONE } from './humanoid-rig';
export { buildSkinnedHumanoidScene, HUMANOID_BONE_PARENT } from './humanoid-skinned';
export { injectVrm10Extension, findMissingVrmBones, REQUIRED_VRM_BONES } from './vrm-extension';
export { buildLookAtExtension, buildSpringBoneExtension } from './vrm-lookat-spring';
export { VRM_EXPRESSION_PRESETS, type VrmExpressionPreset } from './expression-morphs';

export interface BakePartInput {
  name: string;
  preview: PartPreviewMeta;
  bake?: PartBakeMeta;
  /** Pre-loaded GLB buffer when bake.assetKey is set */
  assetBuffer?: Buffer;
}

/** Procedural base body only (no accessories). Humanoid gets a skinned VRM bone hierarchy. */
export async function bakeBaseBody(
  bodyType: AvatarBodyType,
  expressionSettings?: ExpressionMorphSettings,
): Promise<Buffer> {
  ensureGltfExportPolyfills();
  const scene =
    bodyType === AvatarBodyType.HUMANOID_VRM
      ? buildSkinnedHumanoidScene(expressionSettings)
      : buildPartsScene(bodyType, []);
  return exportSceneToGlb(scene);
}

/** Single procedural part mesh as GLB. */
export async function bakeProceduralPart(
  preview: PartPreviewMeta,
  bodyType: AvatarBodyType = AvatarBodyType.HUMANOID_VRM,
): Promise<Buffer> {
  ensureGltfExportPolyfills();
  return exportSceneToGlb(buildPartOnlyScene(preview, bodyType));
}

function resolvePartTransform(
  bodyType: AvatarBodyType,
  preview: PartPreviewMeta,
  bake?: PartBakeMeta,
): { offset: [number, number, number]; scale: [number, number, number]; attachNode?: string; sway?: boolean } {
  const attachTo = bake?.attachTo ?? preview.attachTo;
  const [ax, ay, az] = getAttachPosition(attachTo, bodyType);
  const [ox, oy, oz] = bake?.offset ?? preview.offset;
  const scale = bake?.scale ?? preview.scale;
  const sway = attachTo === 'back';

  if (bodyType === AvatarBodyType.HUMANOID_VRM) {
    const boneName = ATTACH_TO_BONE[attachTo];
    if (boneName) {
      // Parent under the bone so parts follow bone animation; offset is bone-relative.
      const [bx, by, bz] = HUMANOID_BONE_WORLD[boneName];
      return {
        offset: [ax + ox - bx, ay + oy - by, az + oz - bz],
        scale,
        attachNode: boneName,
        sway,
      };
    }
  }

  return { offset: [ax + ox, ay + oy, az + oz], scale, sway };
}

/** Merge base + part GLBs into final model. Humanoid output gets a VRMC_vrm 1.0 extension. */
export async function bakeMergedAvatar(
  bodyType: AvatarBodyType,
  baseBuffer: Buffer,
  parts: BakePartInput[],
  avatarName = 'AMS Avatar',
): Promise<Buffer> {
  const mergeInputs: MergePartInput[] = [];

  for (const part of parts) {
    const { offset, scale, attachNode, sway } = resolvePartTransform(bodyType, part.preview, part.bake);
    let buffer: Buffer;

    if (part.assetBuffer) {
      buffer = part.assetBuffer;
    } else {
      buffer = await bakeProceduralPart(part.preview, bodyType);
    }

    mergeInputs.push({ name: part.name, buffer, offset, scale, attachNode, sway });
  }

  let merged =
    mergeInputs.length > 0 ? await mergeGlbParts(baseBuffer, mergeInputs) : baseBuffer;

  if (bodyType === AvatarBodyType.HUMANOID_VRM) {
    merged = injectVrm10Extension(merged, avatarName);
  }

  return merged;
}

/** Legacy: procedural-only bake (no merge). */
export async function bakePartsToModel(
  bodyType: AvatarBodyType,
  parts: PartPreviewMeta[],
): Promise<Buffer> {
  ensureGltfExportPolyfills();
  const scene = buildPartsScene(bodyType, parts);
  let buffer = await exportSceneToGlb(scene);
  if (bodyType === AvatarBodyType.HUMANOID_VRM) {
    buffer = await tagAsVrm(buffer, 'AMS Avatar');
  }
  return buffer;
}
