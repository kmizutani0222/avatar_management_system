/** Supported avatar body types */
export enum AvatarBodyType {
  HUMANOID_VRM = 'humanoid_vrm',
  BIPED_MASCOT = 'biped_mascot',
  QUADRUPED = 'quadruped',
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
    expressions: false,
    lookAt: false,
    springBone: false,
    humanoidRig: false,
  },
  [AvatarBodyType.QUADRUPED]: {
    expressions: false,
    lookAt: false,
    springBone: false,
    humanoidRig: false,
  },
};

/** GLB output (non-VRM rig) body types */
export function isGlbBodyType(bodyType: AvatarBodyType): boolean {
  return bodyType === AvatarBodyType.BIPED_MASCOT || bodyType === AvatarBodyType.QUADRUPED;
}

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

/** Admin-tunable scales for procedural VRM expression morphs (Phase 16/18). */
export interface ExpressionMorphSettings {
  mouthScale: number;
  eyeScale: number;
  browScale: number;
  /** Per-expression intensity multipliers (0–2), keyed by VRM preset name (Phase 18). */
  expressionIntensity?: Partial<Record<VrmExpressionPreset, number>>;
}

export const DEFAULT_EXPRESSION_MORPH_SETTINGS: ExpressionMorphSettings = {
  mouthScale: 1,
  eyeScale: 1,
  browScale: 1,
  expressionIntensity: {},
};

export const EXPRESSION_MORPH_SETTINGS_KEY = 'expression_morph_settings';

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

/** Named expression presets, e.g. { "笑顔": { happy: 1 }, "悲しい": { sad: 0.9 } } */
export type ExpressionPresetMap = Record<string, Record<string, number>>;

export interface VrmEditorMetadata {
  blendShapes: Record<string, number>;
  /** User-defined expression presets switchable from the SDK. */
  expressionPresets?: ExpressionPresetMap;
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
