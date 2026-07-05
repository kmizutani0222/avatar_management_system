import { createHash, randomBytes } from 'crypto';

export function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateApiKey(): string {
  return `ams_${randomBytes(32).toString('hex')}`;
}

export function generateClientId(): string {
  return `cli_${randomBytes(16).toString('hex')}`;
}

export function generateClientSecret(): string {
  return `sec_${randomBytes(32).toString('hex')}`;
}

export function generateAuthCode(): string {
  return randomBytes(24).toString('hex');
}

export function generateOAuthAccessToken(): string {
  return randomBytes(32).toString('hex');
}
