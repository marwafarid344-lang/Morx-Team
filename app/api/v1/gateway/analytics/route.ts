import { NextRequest, NextResponse } from 'next/server';
import { GatewayDatabase } from '@/lib/gateway/database/gateway-db';
import { GatewayCache } from '@/lib/gateway/core/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const analytics = GatewayDatabase.getAnalytics();
  const cacheStats = GatewayCache.getStats();

  return NextResponse.json({
    success: true,
    service: 'gateway',
    data: {
      ...analytics,
      cache: cacheStats,
    },
    timestamp: new Date().toISOString(),
  });
}

