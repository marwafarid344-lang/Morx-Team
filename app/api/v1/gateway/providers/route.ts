import { NextRequest, NextResponse } from 'next/server';
import { ProviderRegistry } from '@/lib/gateway/core/registry';
import { CircuitBreaker } from '@/lib/gateway/core/circuit-breaker';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ServiceCategory } from '@/lib/gateway/types';
import { GatewayDatabase } from '@/lib/gateway/database/gateway-db';
import { ComplianceRegistry } from '@/lib/gateway/compliance/compliance-registry';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const services: ServiceCategory[] = [
    'videos',
    'weather',
    'maps',
    'routing',
    'instagram',
  ];

  const dbProviders = await GatewayDatabase.listProviders();
  const dbStatusMap = new Map(dbProviders.map((p: any) => [p.id, p]));

  const providerList: Array<any> = [];

  for (const svc of services) {
    const providers = ProviderRegistry.getProviders(svc);
    for (const p of providers) {
      const isAvailable = await p.isAvailable().catch(() => false);
      const capabilities = ProviderRegistry.getCapabilities(p.name);
      const circuit = CircuitBreaker.getStatus(p.name);
      const quota = RateLimiter.getProviderMetrics(p.name);
      const dbEntry = dbStatusMap.get(p.name);
      const compliance = ComplianceRegistry.getConfig(p.name);

      providerList.push({
        id: p.name,
        name: p.name,
        displayName: dbEntry?.name || p.name,
        service: p.service,
        priority: dbEntry?.priority ?? p.priority,
        status: dbEntry?.status || (isAvailable ? 'active' : 'disabled'),
        available: isAvailable,
        circuitState: circuit.state,
        consecutiveFailures: circuit.consecutiveFailures,
        lastSuccessAt: circuit.lastSuccessAt,
        capabilities,
        dailyUsage: quota,
        compliance: compliance ? {
          status: compliance.complianceStatus,
          agreement: compliance.applicableAgreement,
          attribution: compliance.attributionRequirements,
          reason: compliance.restrictionReason,
          clientEligibility: compliance.clientEligibility,
          dataRedistribution: compliance.dataRedistributionPolicy,
        } : null,
      });
    }
  }

  return NextResponse.json({
    success: true,
    service: 'gateway',
    data: providerList,
    total: providerList.length,
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, priority, configuration } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const updated = await GatewayDatabase.updateProvider(id, {
      status,
      priority,
      configuration,
    });

    return NextResponse.json({
      success: true,
      service: 'gateway',
      message: `Provider "${id}" updated successfully in database.`,
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update provider' },
      { status: 500 }
    );
  }
}
