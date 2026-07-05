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

/** GLB asset reference for server-side VRM/GLB bake (Phase 7) */
export interface PartBakeMeta {
  /** MinIO storage key e.g. parts/{partId}/asset.glb */
  assetKey?: string;
  attachTo?: PartPreviewMeta['attachTo'];
  offset?: [number, number, number];
  scale?: [number, number, number];
}

export interface PartMetadata {
  preview?: PartPreviewMeta;
  bake?: PartBakeMeta;
}

/** Parts selection stored on avatar */
export interface PartsConfig {
  selections: Record<string, string>;
}

export type UserRole = 'admin' | 'user' | 'operator';

export type OperatorStatus = 'pending' | 'active' | 'suspended';

export interface AdminUserSummary {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  _count?: { avatars: number };
}

export interface AdminOperatorSummary {
  id: string;
  email: string;
  companyName: string;
  status: OperatorStatus;
  createdAt: string;
  _count?: { apiKeys: number; oauthClients: number };
}

export interface ApiKeyCreated {
  id: string;
  name: string;
  rateLimit: number;
  createdAt: string;
  apiKey: string;
}

export interface ApiKeySummary {
  id: string;
  name: string;
  rateLimit: number;
  revokedAt: string | null;
  createdAt: string;
}

export interface OAuthClientCreated {
  id: string;
  clientId: string;
  name: string;
  redirectUris: string[];
  isActive: boolean;
  createdAt: string;
  clientSecret: string;
}

export interface OAuthClientSummary {
  id: string;
  clientId: string;
  name: string;
  redirectUris: string[];
  isActive: boolean;
  createdAt: string;
}

export interface OAuthAuthorizeResponse {
  code: string;
  expiresIn: number;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface VrmEditorMetadata {
  blendShapes: Record<string, number>;
}

/** VRM 1.0 preset expressions baked into AMS humanoid_vrm avatars (Phase 10). */
export const VRM_EXPRESSION_PRESETS = [
  'happy',
  'angry',
  'sad',
  'relaxed',
  'surprised',
  'aa',
  'ih',
  'ou',
  'ee',
  'oh',
  'blink',
  'blinkLeft',
  'blinkRight',
] as const;

export type VrmExpressionPreset = (typeof VRM_EXPRESSION_PRESETS)[number];

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
