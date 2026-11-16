import { UnifiedError } from '../types';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitConfig {
  failureThreshold: number; // consecutive failures to open circuit (default: 5)
  resetTimeoutMs: number;   // time to wait before trying half-open (default: 30,000ms)
  timeoutMs: number;        // single execution timeout limit (default: 8,000ms)
}

export class CircuitBreaker {
  private static circuits = new Map<
    string,
    {
      state: CircuitState;
      consecutiveFailures: number;
      lastFailedAt: number;
      lastSuccessAt: number;
    }
  >();

  private static defaultConfig: CircuitConfig = {
    failureThreshold: 5,
    resetTimeoutMs: 30_000,
    timeoutMs: 10_000,
  };

  /**
   * Check if circuit allows execution for provider
   */
  static isAllowed(providerName: string): boolean {
    const circuit = this.getOrCreate(providerName);

    if (circuit.state === 'CLOSED') {
      return true;
    }

    if (circuit.state === 'OPEN') {
      // Check if reset timeout elapsed to transition to HALF_OPEN
      if (Date.now() - circuit.lastFailedAt > this.defaultConfig.resetTimeoutMs) {
        circuit.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }

    // HALF_OPEN: allow 1 probe
    return true;
  }

  /**
   * Execute with timeout and circuit monitoring
   */
  static async execute<T>(
    providerName: string,
    action: () => Promise<T>,
    timeoutMs = this.defaultConfig.timeoutMs
  ): Promise<T> {
    if (!this.isAllowed(providerName)) {
      const err: UnifiedError = {
        code: 'CIRCUIT_BREAKER_OPEN',
        message: `Provider "${providerName}" is temporarily suspended due to repeated failures. Circuit breaker is OPEN.`,
        provider: providerName,
        retryable: true,
      };
      throw err;
    }

    // Run action with AbortSignal / Promise.race timeout
    let timer: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject({
          code: 'PROVIDER_TIMEOUT',
          message: `Request to provider "${providerName}" timed out after ${timeoutMs}ms.`,
          provider: providerName,
          retryable: true,
        });
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([action(), timeoutPromise]);
      if (timer) clearTimeout(timer);
      this.recordSuccess(providerName);
      return result;
    } catch (error: any) {
      if (timer) clearTimeout(timer);
      this.recordFailure(providerName, error);
      throw error;
    }
  }

  static recordSuccess(providerName: string): void {
    const circuit = this.getOrCreate(providerName);
    circuit.consecutiveFailures = 0;
    circuit.lastSuccessAt = Date.now();
    circuit.state = 'CLOSED';
  }

  static recordFailure(providerName: string, error?: unknown): void {
    const circuit = this.getOrCreate(providerName);
    circuit.consecutiveFailures++;
    circuit.lastFailedAt = Date.now();

    if (circuit.consecutiveFailures >= this.defaultConfig.failureThreshold) {
      circuit.state = 'OPEN';
    }
  }

  static getStatus(providerName: string) {
    const circuit = this.getOrCreate(providerName);
    return {
      state: circuit.state,
      consecutiveFailures: circuit.consecutiveFailures,
      lastFailedAt: circuit.lastFailedAt ? new Date(circuit.lastFailedAt).toISOString() : null,
      lastSuccessAt: circuit.lastSuccessAt ? new Date(circuit.lastSuccessAt).toISOString() : null,
    };
  }

  private static getOrCreate(providerName: string) {
    let circuit = this.circuits.get(providerName);
    if (!circuit) {
      circuit = {
        state: 'CLOSED',
        consecutiveFailures: 0,
        lastFailedAt: 0,
        lastSuccessAt: Date.now(),
      };
      this.circuits.set(providerName, circuit);
    }
    return circuit;
  }
}

