import fs from 'fs';
import path from 'path';

// Pre-load .env.local if present
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val.replace(/^["']|["']$/g, '');
        }
      }
    }
  }
} catch {}

import assert from 'assert';
import { GatewayCache } from '../lib/gateway/core/cache';
import { RateLimiter } from '../lib/gateway/core/rate-limiter';
import { CircuitBreaker } from '../lib/gateway/core/circuit-breaker';
import { FilterEngine } from '../lib/gateway/core/filter-engine';
import { ProviderRegistry } from '../lib/gateway/core/registry';
import { InternalTspProvider } from '../lib/gateway/providers/routing/internal-tsp';
import { hashApiKey, generateApiKey } from '../lib/gateway/security/crypto';
import { GatewayDatabase } from '../lib/gateway/database/gateway-db';
import { ComplianceRegistry } from '../lib/gateway/compliance/compliance-registry';
import { ComplianceEngine } from '../lib/gateway/compliance/compliance-engine';
import { ProviderOrchestrator } from '../lib/gateway/core/orchestrator';

async function runGatewayTests() {
  console.log('🧪 Starting Morx Gateway Test Suite...\n');

  // ── TEST 1: Cache Layer ──
  console.log('1. Testing GatewayCache...');
  const testKey = GatewayCache.generateKey('weather', 'current', { city: 'Alexandria', unit: 'celsius' });
  GatewayCache.set(testKey, { temp: 24, city: 'Alexandria' }, 60, 'openweather');

  const cached = GatewayCache.get<{ temp: number; city: string }>(testKey);
  assert.strictEqual(cached.hit, true, 'Cache should register a HIT');
  assert.strictEqual(cached.data?.temp, 24, 'Cached data temperature should be 24');
  assert.strictEqual(cached.provider, 'openweather', 'Cached provider should be openweather');

  const miss = GatewayCache.get('non_existent_key');
  assert.strictEqual(miss.hit, false, 'Non-existent key should be a MISS');
  console.log('   ✓ Cache storage, hit/miss, and keys working correctly.');

  // ── TEST 2: Rate Limiter ──
  console.log('\n2. Testing RateLimiter...');
  const testClient = {
    id: 'test_client_01',
    name: 'Unit Test Client',
    status: 'active' as const,
    rateLimitPerMinute: 3,
    rateLimitPerHour: 100,
    rateLimitPerDay: 1000,
    allowedServices: ['*'] as ['*'],
    createdAt: new Date().toISOString(),
  };

  assert.strictEqual(RateLimiter.checkClientLimit(testClient).allowed, true, 'Request 1 should be allowed');
  assert.strictEqual(RateLimiter.checkClientLimit(testClient).allowed, true, 'Request 2 should be allowed');
  assert.strictEqual(RateLimiter.checkClientLimit(testClient).allowed, true, 'Request 3 should be allowed');
  const fourth = RateLimiter.checkClientLimit(testClient);
  assert.strictEqual(fourth.allowed, false, 'Request 4 must be BLOCKED by rate limit');
  assert.strictEqual(fourth.error?.code, 'RATE_LIMIT_EXCEEDED');
  console.log('   ✓ RateLimiter correctly enforces sliding window limit.');

  // ── TEST 3: Circuit Breaker ──
  console.log('\n3. Testing CircuitBreaker...');
  const testProviderName = 'test_unstable_provider';
  assert.strictEqual(CircuitBreaker.isAllowed(testProviderName), true, 'Initial circuit state must be allowed');

  for (let i = 0; i < 5; i++) {
    CircuitBreaker.recordFailure(testProviderName);
  }
  const status = CircuitBreaker.getStatus(testProviderName);
  assert.strictEqual(status.state, 'OPEN', 'Circuit should transition to OPEN after 5 failures');
  assert.strictEqual(CircuitBreaker.isAllowed(testProviderName), false, 'Circuit must block execution when OPEN');
  console.log('   ✓ CircuitBreaker state transitions and trips correctly on failures.');

  // ── TEST 4: Filter Engine ──
  console.log('\n4. Testing FilterEngine...');
  const mockVideos = [
    { id: '1', title: 'Alexandria Sea Walk', duration_seconds: 120, published_at: '2026-05-01T10:00:00Z' },
    { id: '2', title: 'Cairo Street Food', duration_seconds: 600, published_at: '2026-06-01T10:00:00Z' },
    { id: '3', title: 'Alexandria Library Tour', duration_seconds: 300, published_at: '2026-07-01T10:00:00Z' },
  ];

  const searchFiltered = FilterEngine.applyFilters(mockVideos, {
    q: 'Alexandria',
    searchFields: ['title'],
  });
  assert.strictEqual(searchFiltered.total, 2, 'Should find 2 videos matching Alexandria');

  const durationFiltered = FilterEngine.applyFilters(mockVideos, {
    minDurationSeconds: 200,
    maxDurationSeconds: 400,
  });
  assert.strictEqual(durationFiltered.total, 1, 'Should find 1 video with duration between 200s and 400s');
  assert.strictEqual(durationFiltered.filtered[0].id, '3');
  console.log('   ✓ FilterEngine keyword, duration, and range filtering passed.');

  // ── TEST 5: Route Optimization (Internal 2-opt TSP Solver) ──
  console.log('\n5. Testing Route Optimization (Internal TSP Heuristic)...');
  const tsp = new InternalTspProvider();
  const tspResult = await tsp.execute('optimize', {
    origin: { lat: 31.2001, lon: 29.9187 },
    stops: [
      { id: 'A', lat: 31.2089, lon: 29.9092 },
      { id: 'B', lat: 31.215, lon: 29.95 },
      { id: 'C', lat: 31.19, lon: 29.92 },
    ],
    destination: { lat: 31.18, lon: 29.9 },
  });

  assert.strictEqual(tspResult.success, true, 'TSP Optimization should succeed');
  const optData: any = tspResult.data;
  assert.strictEqual(Array.isArray(optData.optimized_order), true, 'Should return array of stop IDs');
  assert.strictEqual(optData.optimized_order.length, 3, 'Should sequence all 3 stops');
  assert.strictEqual(optData.total_distance_meters > 0, true, 'Should compute total distance');
  assert.strictEqual(optData.total_duration_seconds > 0, true, 'Should compute travel duration');
  console.log('   ✓ Internal TSP heuristic successfully sequenced stops with metrics:');
  console.log(`     Sequence: ${optData.optimized_order.join(' -> ')}`);
  console.log(`     Distance: ${(optData.total_distance_meters / 1000).toFixed(2)} km`);
  console.log(`     Duration: ${Math.round(optData.total_duration_seconds / 60)} mins`);

  // ── TEST 6: Security & API Key Management ──
  console.log('\n6. Testing Security & API Keys...');
  const keyGen = generateApiKey('live');
  assert.strictEqual(keyGen.keyPrefix.startsWith('morx_live_'), true, 'Prefix should be morx_live_');
  const reHash = hashApiKey(keyGen.rawKey);
  assert.strictEqual(reHash, keyGen.keyHash, 'Hashed key must match generated hash');

  // Test dynamic client creation & persistence
  const createdClient = await GatewayDatabase.createClient({
    name: 'Dynamic Test Client',
    allowedServices: ['videos', 'weather'],
  });
  const lookup = await GatewayDatabase.getClientByKeyHash(hashApiKey(createdClient.rawKey));
  assert.notStrictEqual(lookup, null, 'Dynamically created key must be found in database');
  assert.strictEqual(lookup?.client.id, createdClient.client.id);
  assert.deepStrictEqual(lookup?.client.allowedServices, ['videos', 'weather']);

  // Test dynamic deletion
  const deleteResult = await GatewayDatabase.deleteClient(createdClient.client.id);
  assert.strictEqual(deleteResult, true, 'Client should be successfully deleted');
  const afterDeleteLookup = await GatewayDatabase.getClientByKeyHash(hashApiKey(createdClient.rawKey));
  assert.strictEqual(afterDeleteLookup, null, 'Deleted client must not be found');
  console.log('   ✓ Dynamic API Key creation, hashing, permission scopes, and deletion verified.');

  // ── TEST 7: Provider Registry & Catalog ──
  console.log('\n7. Testing Provider Registry & Catalog...');
  const videoProviders = ProviderRegistry.getProviders('videos');
  const weatherProviders = ProviderRegistry.getProviders('weather');
  const mapsProviders = ProviderRegistry.getProviders('maps');
  const routingProviders = ProviderRegistry.getProviders('routing');
  const tiktokProviders = ProviderRegistry.getProviders('tiktok');
  const instagramProviders = ProviderRegistry.getProviders('instagram');

  assert.strictEqual(videoProviders.length >= 1, true, 'Videos provider registered');
  assert.strictEqual(weatherProviders.length >= 1, true, 'Weather provider registered');
  assert.strictEqual(mapsProviders.length >= 2, true, 'Maps providers registered (Google + Mapbox)');
  assert.strictEqual(routingProviders.length >= 2, true, 'Routing providers registered (Google + Internal TSP)');
  assert.strictEqual(tiktokProviders.length >= 1, true, 'TikTok provider registered');
  assert.strictEqual(instagramProviders.length >= 1, true, 'Instagram provider registered');
  console.log('   ✓ All 8 service providers and capabilities registered successfully.');

  // ── TEST 8: Provider Compliance Engine & Registry ──
  console.log('\n8. Testing Provider Compliance Engine & Policy Enforcement...');
  
  // 8.1 YouTube Proxying Blocked Pending Approval for External Clients
  const ytExternalEval = ComplianceEngine.evaluate('youtube', 'videos', 'search', {
    clientTier: 'third_party_developer',
    isFirstParty: false,
  });
  assert.strictEqual(ytExternalEval.allowed, false, 'External developer proxying of YouTube MUST be blocked');
  assert.strictEqual(ytExternalEval.errorCode, 'PROVIDER_COMPLIANCE_RESTRICTION');
  assert.strictEqual(ytExternalEval.complianceStatus, 'BLOCKED_PENDING_APPROVAL');

  // 8.2 YouTube First-Party Internal UI Allowed
  const ytInternalEval = ComplianceEngine.evaluate('youtube', 'videos', 'search', {
    isFirstParty: true,
    clientTier: 'internal',
  });
  assert.strictEqual(ytInternalEval.allowed, true, 'First-party internal embed use case should pass');
  assert.strictEqual(ytInternalEval.attribution?.displayText, 'Powered by YouTube');

  // 8.3 Google Maps Canvas Co-mingling Blocked
  const gmapsCanvasEval = ComplianceEngine.evaluate('google_maps', 'maps', 'geocode', {
    requestedCanvas: 'mapbox',
  });
  assert.strictEqual(gmapsCanvasEval.allowed, false, 'Co-mingling Google Maps on Mapbox canvas must be blocked');
  assert.strictEqual(gmapsCanvasEval.errorCode, 'PROVIDER_COMPLIANCE_RESTRICTION');

  // 8.4 Mapbox Approved & Provides Attribution
  const mapboxEval = ComplianceEngine.evaluate('mapbox', 'maps', 'geocode', {
    clientTier: 'third_party_developer',
  });
  assert.strictEqual(mapboxEval.allowed, true, 'Mapbox geocoding must be approved');
  assert.strictEqual(mapboxEval.complianceStatus, 'APPROVED');
  assert.strictEqual(mapboxEval.attribution?.displayText, '© Mapbox © OpenStreetMap');

  // 8.5 TikTok / Instagram Blocked Pending Approval
  const tiktokEval = ComplianceEngine.evaluate('tiktok', 'social', 'feed', {
    clientTier: 'third_party_developer',
  });
  assert.strictEqual(tiktokEval.allowed, false, 'TikTok proxying must be BLOCKED_PENDING_APPROVAL');
  assert.strictEqual(tiktokEval.errorCode, 'PROVIDER_COMPLIANCE_RESTRICTION');

  const igEval = ComplianceEngine.evaluate('instagram', 'social', 'feed', {
    clientTier: 'third_party_developer',
  });
  assert.strictEqual(igEval.allowed, false, 'Instagram proxying must be BLOCKED_PENDING_APPROVAL');

  // 8.6 Runtime Orchestrator Zero Silent Fallback on Compliance Rejection
  const orchResult = await ProviderOrchestrator.execute('videos', 'search', { q: 'Cairo' }, {
    clientTier: 'third_party_developer',
    isFirstParty: false,
  });
  assert.strictEqual(orchResult.success, false, 'Orchestrator must not execute YouTube for unapproved client');
  assert.strictEqual(orchResult.error?.code, 'PROVIDER_COMPLIANCE_RESTRICTION');
  console.log('   ✓ Compliance Engine successfully enforces policy restrictions, zero silent fallback, and attribution.');

  // ── TEST 9: Data Retention & Purge ──
  console.log('\n9. Testing Data Retention & Purge Controls...');
  const isolatedKey = GatewayCache.generateKey('maps', 'geocode', { address: 'Cairo' }, 'client_iso_01');
  GatewayCache.set(isolatedKey, { lat: 30, lng: 31 }, 3600, 'mapbox');
  assert.strictEqual(GatewayCache.get(isolatedKey).hit, true, 'Cached item exists');
  
  const purgedCount = GatewayCache.purgeClientData('client_iso_01');
  assert.strictEqual(purgedCount >= 1, true, 'Client isolation purge must delete data');
  assert.strictEqual(GatewayCache.get(isolatedKey).hit, false, 'Purged data must result in cache miss');
  console.log('   ✓ Data retention, client isolation, and purge handlers working as specified.');

  console.log('\n🎉 ALL 9 GATEWAY TEST SUITES PASSED CLEANLY!\n');
}

runGatewayTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
