import { NextRequest } from 'next/server';
import { hashApiKey } from './crypto';
import { GatewayDatabase } from '../database/gateway-db';
import {
  AuthenticatedClientContext,
  ServiceCategory,
  UnifiedError,
} from '../types';

export class AuthGuard {
  /**
   * Verify an incoming request's API Key and validate scope
   */
  static async verify(
    request: NextRequest,
    requiredService?: ServiceCategory
  ): Promise<{
    authenticated: boolean;
    context?: AuthenticatedClientContext;
    error?: UnifiedError;
  }> {
    // 1. Extract Bearer token or x-api-key
    const authHeader = request.headers.get('authorization');
    const xApiKey = request.headers.get('x-api-key');

    let rawKey: string | null = null;
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      rawKey = authHeader.substring(7).trim();
    } else if (xApiKey) {
      rawKey = xApiKey.trim();
    }

    if (!rawKey) {
      return {
        authenticated: false,
        error: {
          code: 'UNAUTHORIZED',
          message:
            'Missing API key. Provide your key via "Authorization: Bearer <key>" or "x-api-key" header.',
          retryable: false,
        },
      };
    }

    // 2. Check Master Key (configured in env)
    const masterKey = process.env.MORX_GATEWAY_MASTER_KEY;
    if (masterKey && rawKey === masterKey) {
      return {
        authenticated: true,
        context: {
          client: {
            id: 'client_master_admin',
            name: 'Master Admin Client',
            status: 'active',
            rateLimitPerMinute: 10000,
            rateLimitPerHour: 100000,
            rateLimitPerDay: 1000000,
            allowedServices: ['*'],
            createdAt: new Date().toISOString(),
          },
          keyId: 'key_master',
          scopes: ['*'],
        },
      };
    }

    // 3. Lookup Key in Gateway Database
    const keyHash = hashApiKey(rawKey);
    const clientRecord = await GatewayDatabase.getClientByKeyHash(keyHash);

    if (!clientRecord) {
      return {
        authenticated: false,
        error: {
          code: 'INVALID_API_KEY',
          message:
            'The provided Morx API Key is invalid, suspended, or expired.',
          retryable: false,
        },
      };
    }

    const { client, key } = clientRecord;

    // Check key expiration if present
    if (key.expiresAt && new Date(key.expiresAt).getTime() < Date.now()) {
      return {
        authenticated: false,
        error: {
          code: 'API_KEY_EXPIRED',
          message: 'The provided API Key has expired. Please generate a new key.',
          retryable: false,
        },
      };
    }

    // 4. Verify Service Category permissions
    if (requiredService) {
      const allowed = client.allowedServices;
      const hasPermission =
        allowed.includes('*') ||
        allowed.includes(requiredService as ServiceCategory);

      if (!hasPermission) {
        return {
          authenticated: false,
          error: {
            code: 'FORBIDDEN_SERVICE',
            message: `API Client "${client.name}" does not have permission to access the "${requiredService}" service.`,
            retryable: false,
          },
        };
      }
    }

    return {
      authenticated: true,
      context: {
        client,
        keyId: key.id,
        scopes: client.allowedServices,
      },
    };
  }
}

