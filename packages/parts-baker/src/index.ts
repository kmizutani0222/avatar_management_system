import type { AvatarBodyType, PartBakeMeta, PartPreviewMeta } from '@ams/shared-types';
import { buildPartsScene } from './build-scene';
import { buildPartOnlyScene } from './build-part-scene';
import { exportSceneToGlb } from './export-glb';
import { ensureGltfExportPolyfills } from './node-polyfills';
import { mergeGlbParts, tagAsVrm, type MergePartInput } from './merge-glb';
import { getAttachPosition } from './attach-points';
import { bakeDefaultVrmThumbnail, bakePartsThumbnail } from './render-thumbnail';

export { buildPartsScene } from './build-scene';
export { buildPartOnlyScene } from './build-part-scene';
export { exportSceneToGlb } from './export-glb';
export { mergeGlbParts, tagAsVrm } from './merge-glb';
export { bakePartsThumbnail, bakeDefaultVrmThumbnail } from './render-thumbnail';
export { resolvePartsFromSelections, parsePartMetadata } from './resolve-parts';
export type { ResolvedPart } from './resolve-parts';

export interface BakePartInput {
  name: string;
  preview: PartPreviewMeta;
  bake?: PartBakeMeta;
  /** Pre-loaded GLB buffer when bake.assetKey is set */
  assetBuffer?: Buffer;
}

/** Procedural base body only (no accessories). */
export async function bakeBaseBody(bodyType: AvatarBodyType): Promise<Buffer> {
  ensureGltfExportPolyfills();
  const scene = buildPartsScene(bodyType, []);
  return exportSceneToGlb(scene);
}

/** Single procedural part mesh as GLB. */
export async function bakeProceduralPart(preview: PartPreviewMeta): Promise<Buffer> {
  ensureGltfExportPolyfills();
  return exportSceneToGlb(buildPartOnlyScene(preview));
}

function resolvePartTransform(
  preview: PartPreviewMeta,
  bake?: PartBakeMeta,
): { offset: [number, number, number]; scale: [number, number, number] } {
  const attachTo = bake?.attachTo ?? preview.attachTo;
  const [ax, ay, az] = getAttachPosition(attachTo);
  const [ox, oy, oz] = bake?.offset ?? preview.offset;
  const scale = bake?.scale ?? preview.scale;
  return {
    offset: [ax + ox, ay + oy, az + oz],
    scale,
  };
}

/** Merge base + part GLBs into final model. Tags humanoid output as VRM meta. */
export async function bakeMergedAvatar(
  bodyType: AvatarBodyType,
  baseBuffer: Buffer,
  parts: BakePartInput[],
  avatarName = 'AMS Avatar',
): Promise<Buffer> {
  const mergeInputs: MergePartInput[] = [];

  for (const part of parts) {
    const { offset, scale } = resolvePartTransform(part.preview, part.bake);
    let buffer: Buffer;

    if (part.assetBuffer) {
      buffer = part.assetBuffer;
    } else {
      buffer = await bakeProceduralPart(part.preview);
    }

    mergeInputs.push({ name: part.name, buffer, offset, scale });
  }

  let merged =
    mergeInputs.length > 0 ? await mergeGlbParts(baseBuffer, mergeInputs) : baseBuffer;

  if (bodyType === 'humanoid_vrm') {
    merged = await tagAsVrm(merged, avatarName);
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
  if (bodyType === 'humanoid_vrm') {
    buffer = await tagAsVrm(buffer, 'AMS Avatar');
  }
  return buffer;
}
