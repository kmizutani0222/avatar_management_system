import { NodeIO, type Scene } from '@gltf-transform/core';
import {
  createDefaultPropertyResolver,
  dedup,
  mergeDocuments,
  unpartition,
} from '@gltf-transform/functions';

export interface MergePartInput {
  name: string;
  buffer: Buffer;
  offset?: [number, number, number];
  scale?: [number, number, number];
  /** Parent the part under this named node (e.g. a VRM bone) instead of the scene root. */
  attachNode?: string;
}

/**
 * Merge base GLB with part GLB buffers into a single GLB.
 * Note: no flatten() — the base body's bone hierarchy must be preserved.
 */
export async function mergeGlbParts(baseBuffer: Buffer, parts: MergePartInput[]): Promise<Buffer> {
  const io = new NodeIO();
  const baseDoc = await io.readBinary(new Uint8Array(baseBuffer));
  const targetScene = baseDoc.getRoot().getDefaultScene() ?? baseDoc.getRoot().listScenes()[0];

  if (!targetScene) {
    throw new Error('Base GLB has no scene');
  }

  for (const part of parts) {
    const partDoc = await io.readBinary(new Uint8Array(part.buffer));
    const sourceScene = partDoc.getRoot().getDefaultScene() ?? partDoc.getRoot().listScenes()[0];
    if (!sourceScene) continue;

    const resolve = createDefaultPropertyResolver(baseDoc, partDoc);
    const map = mergeDocuments(baseDoc, partDoc, resolve);
    const mergedScene = map.get(sourceScene) as Scene | undefined;
    if (!mergedScene) continue;

    const wrapper = baseDoc.createNode(part.name);
    if (part.offset) wrapper.setTranslation(part.offset);
    if (part.scale) wrapper.setScale(part.scale);

    for (const child of [...mergedScene.listChildren()]) {
      wrapper.addChild(child);
    }

    const parent = part.attachNode
      ? baseDoc
          .getRoot()
          .listNodes()
          .find((node) => node.getName() === part.attachNode)
      : undefined;

    if (parent) {
      parent.addChild(wrapper);
    } else {
      targetScene.addChild(wrapper);
    }
    mergedScene.dispose();
  }

  await baseDoc.transform(dedup(), unpartition());
  return Buffer.from(await io.writeBinary(baseDoc));
}

/** Add minimal VRM 1.0 meta so loaders recognize the file as VRM-capable glTF. */
export async function tagAsVrm(glbBuffer: Buffer, title: string): Promise<Buffer> {
  const io = new NodeIO();
  const doc = await io.readBinary(new Uint8Array(glbBuffer));
  const root = doc.getRoot();

  const asset = root.getAsset();
  asset.generator = 'AMS Parts Baker';
  root.setExtras({
    ...(root.getExtras() as Record<string, unknown> | null ?? {}),
    title,
    vrmMeta: {
      specVersion: '1.0',
      title,
      allowedUserName: 'OnlyAuthor',
      violentUssageName: 'Disallow',
      sexualUssageName: 'Disallow',
      commercialUssageName: 'Disallow',
      otherPermissionUrl: '',
      licenseName: 'Other',
      otherLicenseUrl: '',
    },
  });

  return Buffer.from(await io.writeBinary(doc));
}
