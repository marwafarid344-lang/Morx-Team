import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { UnifiedError, UnifiedResponse } from '../types';

export class Normalizer {
  static generateRequestId(): string {
    return `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  static success<T>(params: {
    service: string;
    data: T;
    provider: string;
    providersUsed?: string[];
    cached?: boolean;
    requestId?: string;
    latencyMs?: number;
    totalReturned?: number;
    nextPage?: string | null;
    quotaCost?: number;
    headers?: Record<string, string>;
  }): NextResponse<UnifiedResponse<T>> {
    const requestId = params.requestId || this.generateRequestId();

    const body: UnifiedResponse<T> = {
      success: true,
      service: params.service,
      data: params.data,
      meta: {
        provider: params.provider,
        providers_used: params.providersUsed || [params.provider],
        cached: params.cached || false,
        request_id: requestId,
        timestamp: new Date().toISOString(),
        latency_ms: params.latencyMs,
        total_returned:
          params.totalReturned !== undefined
            ? params.totalReturned
            : Array.isArray(params.data)
            ? params.data.length
            : 1,
        next_page: params.nextPage || null,
        quota_cost: params.quotaCost,
      },
      errors: [],
    };

    const responseHeaders = new Headers(params.headers || {});
    responseHeaders.set('x-morx-request-id', requestId);
    responseHeaders.set('x-morx-provider', params.provider);
    if (params.cached) {
      responseHeaders.set('x-morx-cache', 'HIT');
    } else {
      responseHeaders.set('x-morx-cache', 'MISS');
    }

    return NextResponse.json(body, {
      status: 200,
      headers: responseHeaders,
    });
  }

  static error(params: {
    service: string;
    statusCode: number;
    errors: UnifiedError[];
    provider?: string;
    requestId?: string;
    headers?: Record<string, string>;
  }): NextResponse<UnifiedResponse<null>> {
    const requestId = params.requestId || this.generateRequestId();

    const body: UnifiedResponse<null> = {
      success: false,
      service: params.service,
      data: null,
      meta: {
        provider: params.provider || 'gateway',
        providers_used: params.provider ? [params.provider] : [],
        cached: false,
        request_id: requestId,
        timestamp: new Date().toISOString(),
      },
      errors: params.errors,
    };

    const responseHeaders = new Headers(params.headers || {});
    responseHeaders.set('x-morx-request-id', requestId);

    return NextResponse.json(body, {
      status: params.statusCode,
      headers: responseHeaders,
    });
  }
}

