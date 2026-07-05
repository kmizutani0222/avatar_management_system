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

export type ExternalAuthContext = ApiKeyAuthContext | OAuthAuthContext;

export interface ExternalAuthRequest {
  externalAuth?: ExternalAuthContext;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | undefined>;
}
