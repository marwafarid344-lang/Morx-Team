import { NextRequest } from 'next/server';
import { hashApiKey } from './crypto';
import { GatewayDatabase } from '../database/gateway-db';
import { AllowableCatalog } from './allowable-catalog';
import {
  AuthenticatedClientContext,
  ServiceCategory,
  UnifiedError,
} from '../types';

export interface AuthVerificationResult {
  authenticated: boolean;
  statusCode?: 401 | 403;
  context?: AuthenticatedClientContext;
  error?: UnifiedError;
}

export class AuthGuard {
  /**
   * Verify an incoming request's API Key and validate scope, allowable endpoints, and providers
   */
  static async verify(
    request: NextRequest,
    requiredService?: ServiceCategory
  ): Promise<AuthVerificationResult> {
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
        statusCode: 401,
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
            allowedProviders: ['*'],
            allowedEndpoints: ['*'],
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
        statusCode: 401,
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
        statusCode: 401,
        error: {
          code: 'API_KEY_EXPIRED',
          message: 'The provided API Key has expired. Please generate a new key.',
          retryable: false,
        },
      };
    }

    // 4. Verify Service Category permissions
    if (requiredService) {
      const allowed = client.allowedServices || ['*'];
      const hasPermission =
        allowed.includes('*') ||
        allowed.includes(requiredService as ServiceCategory);

      if (!hasPermission) {
        return {
          authenticated: false,
          statusCode: 403,
          error: {
            code: 'FORBIDDEN_SERVICE',
            message: `API Client "${client.name}" does not have permission to access the "${requiredService}" service.`,
            retryable: false,
          },
        };
      }
    }

    // 5. Verify Allowed Endpoints list
    const pathname = request.nextUrl ? request.nextUrl.pathname : new URL(request.url).pathname;
    if (client.allowedEndpoints && client.allowedEndpoints.length > 0) {
      const isEndpointAllowed = AllowableCatalog.isAllowableEndpoint(pathname, client.allowedEndpoints);
      if (!isEndpointAllowed) {
        return {
          authenticated: false,
          statusCode: 403,
          error: {
            code: 'FORBIDDEN_ENDPOINT',
            message: `Endpoint "${pathname}" is not on the allowable endpoints list for this client.`,
            retryable: false,
          },
        };
      }
    }

    // 6. Verify Allowed Providers list if specific provider requested
    const requestedProvider = request.nextUrl 
      ? request.nextUrl.searchParams.get('provider') 
      : new URL(request.url).searchParams.get('provider') || request.headers.get('x-morx-provider');

    if (requestedProvider) {
      const isProviderAllowed = AllowableCatalog.isAllowableProvider(requestedProvider, client.allowedProviders);
      if (!isProviderAllowed) {
        return {
          authenticated: false,
          statusCode: 403,
          error: {
            code: 'FORBIDDEN_PROVIDER',
            message: `Provider "${requestedProvider}" is not in the allowable providers list for this client.`,
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
        scopes: client.allowedServices as string[],
      },
    };
  }
}
