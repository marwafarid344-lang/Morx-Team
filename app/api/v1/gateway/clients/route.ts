import { NextRequest, NextResponse } from 'next/server';
import { GatewayDatabase } from '@/lib/gateway/database/gateway-db';
import { Normalizer } from '@/lib/gateway/core/normalizer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const masterKey = process.env.MORX_GATEWAY_MASTER_KEY;
  const authHeader = request.headers.get('authorization');
  const xApiKey = request.headers.get('x-api-key');
  const key = authHeader?.replace('Bearer ', '').trim() || xApiKey?.trim();

  // If master key is configured, protect clients endpoint
  if (masterKey && key !== masterKey) {
    return Normalizer.error({
      service: 'gateway',
      statusCode: 401,
      errors: [{ code: 'UNAUTHORIZED', message: 'Master Key required to list API clients.' }],
    });
  }

  const clients = await GatewayDatabase.listClients();
  return NextResponse.json({
    success: true,
    service: 'gateway',
    data: clients,
    total: clients.length,
  });
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Normalizer.error({
      service: 'gateway',
      statusCode: 400,
      errors: [{ code: 'INVALID_JSON', message: 'Body must be valid JSON.' }],
    });
  }

  const { name, description, allowed_services, rate_limit_per_minute } = body;
  if (!name) {
    return Normalizer.error({
      service: 'gateway',
      statusCode: 400,
      errors: [{ code: 'MISSING_NAME', message: 'Client name is required.' }],
    });
  }

  const { client, rawKey } = await GatewayDatabase.createClient({
    name,
    description,
    allowedServices: allowed_services,
    rateLimitPerMinute: rate_limit_per_minute,
  });

  return NextResponse.json({
    success: true,
    service: 'gateway',
    message: 'API Client registered successfully. Store your rawKey securely; it cannot be retrieved again.',
    data: {
      client,
      apiKey: rawKey,
    },
  });
}

