import { IProvider, ProviderHealth, ProviderResult, ServiceCategory } from '../../types';
import { UnifiedExchangeRate } from '../../types/services';
import { CircuitBreaker } from '../../core/circuit-breaker';
import { RateLimiter } from '../../core/rate-limiter';

export class FrankfurterProvider implements IProvider {
  readonly name = 'frankfurter';
  readonly service: ServiceCategory = 'finance';
  readonly priority = 100;

  async isAvailable(): Promise<boolean> {
    return CircuitBreaker.isAllowed(this.name);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const res = await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR', {
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          status: 'healthy',
          latencyMs,
          lastCheckedAt: new Date().toISOString(),
          consecutiveFailures: 0,
        };
      }
      return {
        status: 'degraded',
        latencyMs,
        lastCheckedAt: new Date().toISOString(),
        errorMessage: `Frankfurter API HTTP ${res.status}`,
        consecutiveFailures: 1,
      };
    } catch (err: any) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        lastCheckedAt: new Date().toISOString(),
        errorMessage: err.message,
        consecutiveFailures: 1,
      };
    }
  }

  async execute<T>(
    operation: string,
    params: Record<string, unknown>
  ): Promise<ProviderResult<T>> {
    const start = Date.now();

    return CircuitBreaker.execute(this.name, async () => {
      if (operation === 'rates' || operation === 'convert' || operation === 'exchange') {
        const base = String(params.base || params.from || 'USD').toUpperCase();
        const target = params.target || params.to || params.symbols ? String(params.target || params.to || params.symbols).toUpperCase() : undefined;
        const amount = params.amount !== undefined ? Number(params.amount) : 1;

        let url = `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(base)}`;
        if (target) {
          url += `&symbols=${encodeURIComponent(target)}`;
        }
        if (amount && amount !== 1) {
          url += `&amount=${encodeURIComponent(amount)}`;
        }

        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);

        if (!res.ok) {
          // Frankfurter (ECB) only tracks ~32 major currencies. For currencies like EGP, SAR, AED,
          // or during Frankfurter upstream downtime, seamlessly fallback to the Global Open Exchange Engine (160+ currencies).
          try {
            const fallbackRes = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`, {
              signal: AbortSignal.timeout(6000),
            });
            if (fallbackRes.ok) {
              const fbData = await fallbackRes.json();
              if (fbData.result === 'success' && fbData.rates) {
                const allRates = fbData.rates as Record<string, number>;
                if (target && allRates[target] === undefined) {
                  return {
                    success: false,
                    data: null,
                    providerName: this.name,
                    latencyMs: Date.now() - start,
                    error: {
                      code: 'UNSUPPORTED_CURRENCY',
                      message: `Target currency '${target}' is not recognized or supported.`,
                      provider: this.name,
                      retryable: false,
                    },
                  };
                }

                const targetRate = target ? allRates[target] : undefined;
                const converted = targetRate !== undefined ? Number((amount * targetRate).toFixed(4)) : undefined;
                const filteredRates = target ? { [target]: targetRate! } : allRates;

                const normalized: UnifiedExchangeRate = {
                  base,
                  target,
                  amount,
                  date: fbData.time_last_update_utc ? new Date(fbData.time_last_update_utc).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                  converted_amount: converted,
                  rates: filteredRates,
                };

                return {
                  success: true,
                  data: normalized as unknown as T,
                  providerName: this.name,
                  latencyMs: Date.now() - start,
                  meta: {
                    source: 'ExchangeRate Engine (Global Open Rates)',
                    note: `Currency '${base}' resolved via Global Exchange Engine fallback.`,
                  },
                };
              }
            }
          } catch {
            // fallback error, proceed to standard error reporting
          }

          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: `Frankfurter API failed with HTTP ${res.status}. Currency '${base}' may not be tracked by the European Central Bank.`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const rates = data.rates || {};
        const converted = target && rates[target] !== undefined ? rates[target] : undefined;

        const normalized: UnifiedExchangeRate = {
          base: data.base || base,
          target,
          amount: data.amount || amount,
          date: data.date || new Date().toISOString().split('T')[0],
          converted_amount: converted,
          rates,
        };

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
          meta: {
            source: 'European Central Bank (Frankfurter)',
          },
        };
      }

      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: 0,
        error: {
          code: 'UNSUPPORTED_OPERATION',
          message: `Frankfurter provider does not support operation "${operation}".`,
          provider: this.name,
          retryable: false,
        },
      };
    });
  }
}
