import crypto from 'crypto';

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Generate a cryptographically secure Morx API Key
 */
export function generateApiKey(environment: 'live' | 'test' = 'live'): {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const randomBytes = crypto.randomBytes(24).toString('base64url');
  const keyPrefix = `morx_${environment}_${randomBytes.slice(0, 7)}`;
  const rawKey = `${keyPrefix}_${randomBytes.slice(7)}`;
  const keyHash = hashApiKey(rawKey);

  return {
    rawKey,
    keyPrefix,
    keyHash,
  };
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

