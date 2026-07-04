/** Supported avatar body types (Phase 0 scope) */
export enum AvatarBodyType {
  HUMANOID_VRM = 'humanoid_vrm',
  BIPED_MASCOT = 'biped_mascot',
}

/** How the avatar was created */
export enum AvatarSourceType {
  PARTS = 'parts',
  VRM_UPLOAD = 'vrm_upload',
  VRM_EDITOR = 'vrm_editor',
}

/** Avatar lifecycle status */
export enum AvatarStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  ADMIN_SUSPENDED = 'admin_suspended',
}

/** Model file format */
export enum AvatarFormat {
  VRM = 'vrm',
  GLB = 'glb',
}

export interface AvatarCapabilities {
  expressions: boolean;
  lookAt: boolean;
  springBone: boolean;
  humanoidRig: boolean;
}

export const DEFAULT_CAPABILITIES: Record<AvatarBodyType, AvatarCapabilities> = {
  [AvatarBodyType.HUMANOID_VRM]: {
    expressions: true,
    lookAt: true,
    springBone: true,
    humanoidRig: true,
  },
  [AvatarBodyType.BIPED_MASCOT]: {
    expressions: true,
    lookAt: true,
    springBone: true,
    humanoidRig: true,
  },
};

export interface AvatarSummary {
  id: string;
  name: string;
  bodyType: AvatarBodyType;
  sourceType: AvatarSourceType;
  format: AvatarFormat;
  status: AvatarStatus;
  externalEnabled: boolean;
  adminApproved: boolean;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvatarPartSummary {
  id: string;
  bodyType: AvatarBodyType;
  category: string;
  name: string;
  thumbnailUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  metadata?: PartMetadata;
}

/** 3D preview hints for procedural rendering (Phase 2) */
export interface PartPreviewMeta {
  color: string;
  geometry: 'box' | 'sphere' | 'capsule' | 'cylinder';
  attachTo: 'head' | 'body' | 'root' | 'back';
  offset: [number, number, number];
  scale: [number, number, number];
}

export interface PartMetadata {
  preview?: PartPreviewMeta;
}

/** Parts selection stored on avatar */
export interface PartsConfig {
  selections: Record<string, string>;
}

export type UserRole = 'admin' | 'user' | 'operator';

export interface VrmEditorMetadata {
  blendShapes: Record<string, number>;
}

export interface AuthLoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  role: UserRole;
}

export interface AuthProfile {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  companyName?: string;
  status?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiHealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}
