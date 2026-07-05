import type { PartPreviewMeta } from '@ams/shared-types';

const ATTACH_POINTS: Record<PartPreviewMeta['attachTo'], [number, number, number]> = {
  root: [0, 0, 0],
  body: [0, 0.9, 0],
  head: [0, 1.5, 0],
  back: [0, 0.9, -0.25],
};

export function getAttachPosition(attachTo: PartPreviewMeta['attachTo']): [number, number, number] {
  return ATTACH_POINTS[attachTo];
}

export const HUMANOID_BASE = {
  skinColor: '#f5d0a9',
  bodyColor: '#4a90d9',
};

export const MASCOT_BASE = {
  bodyColor: '#ffb347',
  headColor: '#ffcc80',
};
