# MORX — System Architecture Specification

## 1. High-Level Architectural Model

The Morx Unified API Gateway acts as an intelligent abstraction and orchestration layer sitting between client applications (such as the Graduation Project) and downstream third-party service providers.

```text
               CLIENT APPLICATION (Graduation Project / Web / Mobile)
                                      |
                                      | [HTTPS + Authorization: Bearer morx_live_...]
                                      v
                        +----------------------------+
                        |      MORX API GATEWAY      |
                        +----------------------------+
                                      |
                                      v
                        +----------------------------+
                        |    Security & Auth Guard   |
                        |   (SHA-256 Key Validation) |
                        +----------------------------+
                                      |
                                      v
                        +----------------------------+
                        |   Client Rate Limiting     |
                        |  (Sliding Window Bucket)   |
                        +----------------------------+
                                      |
                                      v
                        +----------------------------+
                        |   Gateway Cache & Dedupe   | ---> [HIT: Return Normalized Data]
                        +----------------------------+
                                      | [MISS]
                                      v
                        +----------------------------+
                        |   PROVIDER ORCHESTRATOR    |
                        | (Selection, Failover, CB)  |
                        +----------------------------+
                                      |
           +-----------------+--------+--------+-----------------+
           |                 |                 |                 |
           v                 v                 v                 v
     [VIDEOS]          [WEATHER]            [MAPS]           [ROUTING]
    - YouTube v3      - OpenWeather      - Google Maps     - Google Routes
                                         - Mapbox          - Internal TSP (2-opt)
           |                 |                 |                 |
           +-----------------+--------+--------+-----------------+
                                      |
                                      v
                        +----------------------------+
                        |    Response Normalizer     |
                        | (Common Envelope & Schema) |
                        +----------------------------+
                                      |
                                      v
                        +----------------------------+
                        |   Intelligent Filtering    |
                        | (Post-fetch refine/paging) |
                        +----------------------------+
                                      |
                                      v
                        +----------------------------+
                        |   Async Usage Analytics    |
                        |   & Health Metrics Store   |
                        +----------------------------+
                                      |
                                      v
                        UNIFIED JSON RESPONSE TO CLIENT
```

---

## 2. Core Architectural Pillars

### 2.1 Provider Abstraction & Registry
All third-party services are wrapped in the standard `IProvider` contract:
```typescript
interface IProvider {
  readonly name: string;
  readonly service: ServiceCategory;
  readonly priority: number;
  isAvailable(): Promise<boolean>;
  healthCheck(): Promise<ProviderHealth>;
  execute<T>(operation: string, params: Record<string, unknown>): Promise<ProviderResult<T>>;
}
```
Providers register deterministically into `ProviderRegistry`. Capabilities are cataloged upfront so the orchestrator never dispatches requests to incompatible providers.

### 2.2 Response Normalization
Regardless of whether a video originates from YouTube or an alternative provider, or whether directions originate from Google Maps or Mapbox, the consuming developer receives a unified envelope:
```json
{
  "success": true,
  "service": "videos",
  "data": [...],
  "meta": {
    "provider": "youtube",
    "providers_used": ["youtube"],
    "cached": false,
    "request_id": "req_1740000000_a1b2",
    "timestamp": "2026-10-31T18:00:00.000Z",
    "latency_ms": 142,
    "total_returned": 20,
    "next_page": "CAUQAA"
  },
  "errors": []
}
```

### 2.3 Resilience & Circuit Breaking
Every outbound provider execution is governed by `CircuitBreaker.execute(providerName, fn, timeoutMs)`:
* **CLOSED:** Standard state. Failures increment counter.
* **OPEN:** When 5 consecutive failures occur, circuit trips to OPEN for 30 seconds. Outbound calls are suspended, allowing immediate failover without cascading timeouts.
* **HALF_OPEN:** After timeout expires, 1 trial probe call is allowed. If successful, state reverts to CLOSED.

### 2.4 Caching & Request Coalescing
* In-memory SHA-256 hashed keys based on service, operation, and canonical query parameters.
* Request Coalescing deduplicates concurrent identical requests so only a single outbound API call is issued to upstream providers.
* TTLs: Weather (5–15 min), Geocoding (24 hours), Places (30 min), Directions (5 min), Videos (10 min), Routing (15 min).

