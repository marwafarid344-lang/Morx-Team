import { NextRequest, NextResponse } from 'next/server';
import { ProviderRegistry } from '@/lib/gateway/core/registry';
import { ServiceCategory } from '@/lib/gateway/types';
import { Normalizer } from '@/lib/gateway/core/normalizer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Normalizer.error({
      service: 'gateway',
      statusCode: 400,
      errors: [{ code: 'INVALID_JSON', message: 'Request body must be valid JSON.' }],
    });
  }

  const { service, provider, operation, params } = body;

  if (!service || !provider || !operation) {
    return Normalizer.error({
      service: 'gateway',
      statusCode: 400,
      errors: [
        {
          code: 'MISSING_FIELDS',
          message: '"service", "provider", and "operation" are required for testing.',
        },
      ],
    });
  }

  const providerInstance = ProviderRegistry.getProvider(service as ServiceCategory, provider);
  if (!providerInstance) {
    return Normalizer.error({
      service: 'gateway',
      statusCode: 404,
      errors: [
        {
          code: 'PROVIDER_NOT_FOUND',
          message: `Provider "${provider}" for service "${service}" was not found.`,
        },
      ],
    });
  }

  const start = Date.now();
  try {
    const result = await providerInstance.execute(operation, params || {});
    const totalLatencyMs = Date.now() - start;

    return NextResponse.json({
      success: result.success,
      service,
      provider,
      operation,
      latencyMs: result.latencyMs || totalLatencyMs,
      data: result.data,
      error: result.error || null,
      rawSummary: result.rawResponse ? 'Raw response captured (sanitized)' : null,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      service,
      provider,
      operation,
      latencyMs: Date.now() - start,
      data: null,
      error: {
        code: err?.code || 'TEST_EXECUTION_ERROR',
        message: err?.message || 'An error occurred while executing the provider test.',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

