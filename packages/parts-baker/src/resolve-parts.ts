import type { PartBakeMeta, PartMetadata, PartPreviewMeta } from '@ams/shared-types';

export interface ResolvedPart {
  category: string;
  name: string;
  preview: PartPreviewMeta;
  bake?: PartBakeMeta;
}

export function parsePartMetadata(metadata: unknown): PartMetadata | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const meta = metadata as PartMetadata;
  if (!meta.preview?.geometry || !meta.preview.color) return null;
  return meta;
}

/** Build resolved parts from API part records + selections */
export function resolvePartsFromSelections(
  allParts: Array<{ id: string; category: string; name: string; metadata?: unknown }>,
  selections: Record<string, string>,
): ResolvedPart[] {
  const resolved: ResolvedPart[] = [];

  for (const [category, partId] of Object.entries(selections)) {
    const part = allParts.find((p) => p.id === partId);
    if (!part) continue;
    const meta = parsePartMetadata(part.metadata);
    if (!meta?.preview) continue;

    resolved.push({
      category,
      name: part.name,
      preview: meta.preview,
      bake: meta.bake,
    });
  }

  return resolved;
}
