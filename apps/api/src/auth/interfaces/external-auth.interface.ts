export interface ApiKeyAuthContext {
  type: 'api_key';
  operatorId: string;
  apiKeyId: string;
  userId: string;
}

export interface OAuthAuthContext {
  type: 'oauth';
  userId: string;
  clientId: string;
  scopes: string[];
}

/** AMS user portal login JWT — same external avatar access as OAuth for that user. */
export interface SessionAuthContext {
  type: 'session';
  userId: string;
}

export type ExternalAuthContext = ApiKeyAuthContext | OAuthAuthContext | SessionAuthContext;

export interface ExternalAuthRequest {
  externalAuth?: ExternalAuthContext;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | undefined>;
}
