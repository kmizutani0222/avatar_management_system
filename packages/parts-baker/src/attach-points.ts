import { AvatarBodyType, type PartPreviewMeta } from '@ams/shared-types';

const UPRIGHT_ATTACH: Record<PartPreviewMeta['attachTo'], [number, number, number]> = {
  root: [0, 0, 0],
  body: [0, 0.9, 0],
  head: [0, 1.5, 0],
  back: [0, 0.9, -0.25],
};

const QUADRUPED_ATTACH: Record<PartPreviewMeta['attachTo'], [number, number, number]> = {
  root: [0, 0, 0],
  body: [0, 0.45, 0],
  head: [0, 0.55, 0.42],
  back: [0, 0.48, -0.35],
};

export function getAttachPosition(
  attachTo: PartPreviewMeta['attachTo'],
  bodyType: AvatarBodyType = AvatarBodyType.HUMANOID_VRM,
): [number, number, number] {
  if (bodyType === AvatarBodyType.QUADRUPED) {
    return QUADRUPED_ATTACH[attachTo];
  }
  return UPRIGHT_ATTACH[attachTo];
}

export const HUMANOID_BASE = {
  skinColor: '#f5d0a9',
  bodyColor: '#4a90d9',
};

export const MASCOT_BASE = {
  bodyColor: '#ffb347',
  headColor: '#ffcc80',
};

export const QUADRUPED_BASE = {
  bodyColor: '#a1887f',
  headColor: '#bcaaa4',
  legColor: '#8d6e63',
};
