import type { PartPreviewMeta } from '@ams/shared-types';

export interface ResolvedPart {
  category: string;
  name: string;
  preview: PartPreviewMeta;
}

export function parsePartMetadata(metadata: unknown): PartPreviewMeta | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const preview = (metadata as { preview?: PartPreviewMeta }).preview;
  if (!preview?.geometry || !preview.color) return null;
  return preview;
}

/** Build resolved parts from API part records + selections */
export function resolvePartsFromSelections(
  allParts: Array<{ id: string; category: string; name: string; metadata?: unknown }>,
  selections: Record<string, string>,
): ResolvedPart[] {
  return Object.entries(selections)
    .map(([category, partId]) => {
      const part = allParts.find((p) => p.id === partId);
      if (!part) return null;
      const preview = parsePartMetadata(part.metadata);
      if (!preview) return null;
      return { category, name: part.name, preview };
    })
    .filter((p): p is ResolvedPart => p !== null);
}
