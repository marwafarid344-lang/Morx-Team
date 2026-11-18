import { NextRequest, NextResponse } from 'next/server';
import { GatewayDatabase } from '@/lib/gateway/database/gateway-db';
import { Normalizer } from '@/lib/gateway/core/normalizer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const clients = await GatewayDatabase.listClients();
  const response = NextResponse.json({
    success: true,
    service: 'gateway',
    data: clients,
    total: clients.length,
  });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return response;
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
  if (!name || typeof name !== 'string' || !name.trim()) {
    return Normalizer.error({
      service: 'gateway',
      statusCode: 400,
      errors: [{ code: 'MISSING_NAME', message: 'Client name is required.' }],
    });
  }

  const { client, rawKey } = await GatewayDatabase.createClient({
    name: name.trim(),
    description: description || '',
    allowedServices: Array.isArray(allowed_services) && allowed_services.length > 0 ? allowed_services : ['*'],
    rateLimitPerMinute: rate_limit_per_minute ? Number(rate_limit_per_minute) : 120,
  });

  const response = NextResponse.json({
    success: true,
    service: 'gateway',
    message: 'API Client registered successfully. Store your rawKey securely.',
    data: {
      client,
      apiKey: rawKey,
    },
  });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return response;
}

export async function PUT(request: NextRequest) {
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

  const { id, name, description, allowed_services, rate_limit_per_minute, status } = body;
  if (!id) {
    return Normalizer.error({
      service: 'gateway',
      statusCode: 400,
      errors: [{ code: 'MISSING_ID', message: 'Client ID is required for update.' }],
    });
  }

  const updated = await GatewayDatabase.updateClient(id, {
    name: name?.trim(),
    description: description !== undefined ? description : undefined,
    allowedServices: Array.isArray(allowed_services) ? allowed_services : undefined,
    rateLimitPerMinute: rate_limit_per_minute ? Number(rate_limit_per_minute) : undefined,
    status: status,
  });

  if (!updated) {
    return Normalizer.error({
      service: 'gateway',
      statusCode: 404,
      errors: [{ code: 'CLIENT_NOT_FOUND', message: `Client with ID "${id}" was not found.` }],
    });
  }

  const response = NextResponse.json({
    success: true,
    service: 'gateway',
    message: 'Client updated successfully.',
    data: updated,
  });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return response;
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let id = searchParams.get('id');

  if (!id) {
    try {
      const body = await request.json();
      id = body?.id;
    } catch {}
  }

  if (!id) {
    return Normalizer.error({
      service: 'gateway',
      statusCode: 400,
      errors: [{ code: 'MISSING_ID', message: 'Client ID is required for deletion.' }],
    });
  }

  const success = await GatewayDatabase.deleteClient(id);
  if (!success) {
    return Normalizer.error({
      service: 'gateway',
      statusCode: 404,
      errors: [{ code: 'CLIENT_NOT_FOUND', message: `Client with ID "${id}" was not found.` }],
    });
  }

  const response = NextResponse.json({
    success: true,
    service: 'gateway',
    message: `Client "${id}" and all associated API keys have been revoked and deleted.`,
  });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return response;
}
