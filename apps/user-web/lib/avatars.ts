import { authFetch } from '@ams/web-auth';
import { AvatarBodyType, PartsConfig, VrmEditorMetadata } from '@ams/shared-types';
import { getApiUrl } from './api';

export interface ApiPart {
  id: string;
  bodyType: AvatarBodyType;
  category: string;
  name: string;
  metadata: unknown;
  sortOrder: number;
}

export interface ApiAvatar {
  id: string;
  name: string;
  bodyType: AvatarBodyType;
  sourceType: string;
  status: string;
  externalEnabled: boolean;
  modelUrl: string | null;
  thumbnailUrl: string | null;
  partsConfig: PartsConfig | null;
  editorMetadata: VrmEditorMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export function getAvatarModelUrl(avatarId: string, cacheKey?: string): string {
  const url = `${getApiUrl()}/api/user/avatars/${avatarId}/model`;
  return cacheKey ? `${url}?v=${encodeURIComponent(cacheKey)}` : url;
}

export function getAvatarThumbnailUrl(avatarId: string, cacheKey?: string): string {
  const url = `${getApiUrl()}/api/user/avatars/${avatarId}/thumbnail`;
  return cacheKey ? `${url}?v=${encodeURIComponent(cacheKey)}` : url;
}

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  parts: 'パーツ選択',
  vrm_upload: 'VRM アップロード',
  vrm_editor: 'VRM エディタ',
};

export async function fetchParts(bodyType: AvatarBodyType): Promise<ApiPart[]> {
  const res = await fetch(`${getApiUrl()}/api/parts?bodyType=${bodyType}`);
  if (!res.ok) throw new Error('Failed to load parts');
  return res.json();
}

/** Base body GLB URL — same template used at bake time (MinIO / procedural). */
export function getBaseTemplateUrl(bodyType: AvatarBodyType): string {
  return `${getApiUrl()}/api/parts/base-template?bodyType=${bodyType}`;
}

export async function fetchAvatars(token: string): Promise<ApiAvatar[]> {
  const res = await authFetch(getApiUrl(), '/api/user/avatars', token);
  if (!res.ok) throw new Error('Failed to load avatars');
  return res.json();
}

export async function fetchAvatar(token: string, id: string): Promise<ApiAvatar> {
  const res = await authFetch(getApiUrl(), `/api/user/avatars/${id}`, token);
  if (!res.ok) throw new Error('Failed to load avatar');
  return res.json();
}

export async function createAvatar(
  token: string,
  data: { name: string; bodyType: AvatarBodyType; partsConfig: PartsConfig },
): Promise<ApiAvatar> {
  const res = await authFetch(getApiUrl(), '/api/user/avatars', token, {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      bodyType: data.bodyType,
      sourceType: 'parts',
      partsConfig: data.partsConfig,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Failed to create avatar');
  }
  return res.json();
}

export async function updateAvatar(
  token: string,
  id: string,
  data: {
    name?: string;
    partsConfig?: PartsConfig;
    editorMetadata?: VrmEditorMetadata;
    externalEnabled?: boolean;
  },
): Promise<ApiAvatar> {
  const res = await authFetch(getApiUrl(), `/api/user/avatars/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Failed to update avatar');
  }
  return res.json();
}

export async function uploadVrmAvatar(
  token: string,
  data: {
    name: string;
    bodyType: AvatarBodyType;
    sourceType: 'vrm_upload' | 'vrm_editor';
    file: File;
  },
): Promise<ApiAvatar> {
  const form = new FormData();
  form.append('name', data.name);
  form.append('bodyType', data.bodyType);
  form.append('sourceType', data.sourceType);
  form.append('file', data.file);

  const res = await fetch(`${getApiUrl()}/api/user/avatars/vrm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(Array.isArray(err.message) ? err.message.join(', ') : err.message ?? 'Upload failed');
  }
  return res.json();
}

export async function reuploadVrmAvatar(token: string, id: string, file: File): Promise<ApiAvatar> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${getApiUrl()}/api/user/avatars/${id}/reupload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Re-upload failed');
  }
  return res.json();
}

export async function deleteAvatar(token: string, id: string): Promise<void> {
  const res = await authFetch(getApiUrl(), `/api/user/avatars/${id}`, token, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete avatar');
}

export function groupPartsByCategory(parts: ApiPart[]): Record<string, ApiPart[]> {
  return parts.reduce<Record<string, ApiPart[]>>((acc, part) => {
    if (!acc[part.category]) acc[part.category] = [];
    acc[part.category].push(part);
    return acc;
  }, {});
}

export const CATEGORY_LABELS: Record<string, string> = {
  hair: '髪型',
  eyes: '目',
  outfit: '服',
  accessory: 'アクセサリー',
  fur: '毛並み',
  collar: '首輪',
  body: '体',
  ears: '耳',
  tail: 'しっぽ',
  face: '顔',
};

export const BODY_TYPE_LABELS: Record<AvatarBodyType, string> = {
  [AvatarBodyType.HUMANOID_VRM]: '人型（VTuber 向け）',
  [AvatarBodyType.BIPED_MASCOT]: '二足マスコット',
  [AvatarBodyType.QUADRUPED]: '四足動物',
};

export function defaultSelections(parts: ApiPart[]): Record<string, string> {
  const grouped = groupPartsByCategory(parts);
  const selections: Record<string, string> = {};
  for (const [category, items] of Object.entries(grouped)) {
    if (items[0]) selections[category] = items[0].id;
  }
  return selections;
}
