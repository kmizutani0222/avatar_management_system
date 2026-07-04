import { AvatarBodyType, DEFAULT_CAPABILITIES } from '@ams/shared-types';

export const ROLE_ADMIN = 'admin';
export const ROLE_USER = 'user';
export const ROLE_OPERATOR = 'operator';

export type AuthRole = typeof ROLE_ADMIN | typeof ROLE_USER | typeof ROLE_OPERATOR;

export function buildDefaultCapabilities(bodyType: AvatarBodyType) {
  return DEFAULT_CAPABILITIES[bodyType];
}

export function isEditableByAdmin(sourceType: string): boolean {
  return sourceType !== 'vrm_upload';
}

export const MAX_VRM_SIZE_MB = 80;
export const MAX_VRM_SIZE_BYTES = MAX_VRM_SIZE_MB * 1024 * 1024;
