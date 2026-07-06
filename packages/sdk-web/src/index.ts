import type { AvatarBodyType } from '@ams/shared-types';

/** Sent on every AmsClient request — required by external avatar API. */
export const AMS_SDK_WEB_VERSION = '0.0.1';
export const AMS_SDK_CLIENT_HEADER = 'X-AMS-SDK-Client';
export const AMS_SDK_CLIENT_ID = `@ams/sdk-web/${AMS_SDK_WEB_VERSION}`;

export interface AmsClientOptions {
  /** API base URL e.g. https://api.example.com */
  apiBase: string;
  /** OAuth access token (Bearer) */
  accessToken?: string;
  /** Operator API key (server-side only) */
  apiKey?: string;
  /** AMS user ID — required with apiKey */
  userId?: string;
}

export interface ExternalAvatar {
  id: string;
  name: string;
  bodyType: AvatarBodyType;
  sourceType: string;
  format: string;
  status: string;
  externalEnabled: boolean;
  adminApproved: boolean;
  hasModel: boolean;
  hasThumbnail: boolean;
  /** User-defined expression presets (name → expression values), switchable at runtime. */
  expressionPresets: Record<string, Record<string, number>>;
  createdAt: string;
  updatedAt: string;
}

export class AmsClient {
  constructor(private readonly options: AmsClientOptions) {}

  private headers(extra?: HeadersInit): HeadersInit {
    const h: Record<string, string> = {
      Accept: 'application/json',
      [AMS_SDK_CLIENT_HEADER]: AMS_SDK_CLIENT_ID,
      ...(extra as Record<string, string> | undefined),
    };
    if (this.options.accessToken) {
      h.Authorization = `Bearer ${this.options.accessToken}`;
    }
    if (this.options.apiKey) {
      h['X-API-Key'] = this.options.apiKey;
    }
    if (this.options.userId) {
      h['X-User-Id'] = this.options.userId;
    }
    return h;
  }

  private url(path: string): string {
    return `${this.options.apiBase.replace(/\/$/, '')}${path}`;
  }

  async listAvatars(): Promise<ExternalAvatar[]> {
    const res = await fetch(this.url('/api/v1/avatars'), { headers: this.headers() });
    if (!res.ok) throw new Error(`listAvatars failed: ${res.status}`);
    return res.json();
  }

  async getAvatar(id: string): Promise<ExternalAvatar> {
    const res = await fetch(this.url(`/api/v1/avatars/${id}`), { headers: this.headers() });
    if (!res.ok) throw new Error(`getAvatar failed: ${res.status}`);
    return res.json();
  }

  /** Download baked VRM/GLB binary. Follows redirects when MODEL_DELIVERY=presigned. */
  async fetchModel(id: string): Promise<ArrayBuffer> {
    const res = await fetch(this.url(`/api/v1/avatars/${id}/model`), {
      headers: this.headers(),
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`fetchModel failed: ${res.status}`);
    return res.arrayBuffer();
  }

  /** Download PNG thumbnail when hasThumbnail is true. */
  async fetchThumbnail(id: string): Promise<ArrayBuffer> {
    const res = await fetch(this.url(`/api/v1/avatars/${id}/thumbnail`), {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`fetchThumbnail failed: ${res.status}`);
    return res.arrayBuffer();
  }
}

export { AmsClient as default };
