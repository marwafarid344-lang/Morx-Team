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
import { AllowableCatalog } from '../lib/gateway/security/allowable-catalog';
import { AuthGuard } from '../lib/gateway/security/auth-guard';

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
  const instagramProviders = ProviderRegistry.getProviders('instagram');
  const streamingProviders = ProviderRegistry.getProviders('streaming');

  assert.strictEqual(videoProviders.length >= 1, true, 'Videos provider registered');
  assert.strictEqual(weatherProviders.length >= 1, true, 'Weather provider registered');
  assert.strictEqual(mapsProviders.length >= 2, true, 'Maps providers registered (Google + Mapbox)');
  assert.strictEqual(routingProviders.length >= 2, true, 'Routing providers registered (Google + Internal TSP)');
  assert.strictEqual(instagramProviders.length >= 1, true, 'Instagram provider registered');
  assert.strictEqual(streamingProviders.length >= 1, true, 'Streaming provider (Vidora) registered');
  console.log('   ✓ All service providers and capabilities registered successfully.');

  // ── TEST 8: Provider Compliance Engine & Registry ──
  console.log('\n8. Testing Provider Compliance Engine & Policy Enforcement...');
  
  // 8.1 YouTube Approved and Operational
  const ytExternalEval = ComplianceEngine.evaluate('youtube', 'videos', 'search', {
    clientTier: 'third_party_developer',
    isFirstParty: false,
  });
  assert.strictEqual(ytExternalEval.allowed, true, 'YouTube is approved for developer gateway access');
  assert.strictEqual(ytExternalEval.complianceStatus, 'APPROVED');
  assert.strictEqual(ytExternalEval.attribution?.displayText, 'Powered by YouTube');

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

  // 8.5 Instagram Blocked Pending Approval
  const igEval = ComplianceEngine.evaluate('instagram', 'instagram', 'profile', {
    clientTier: 'third_party_developer',
  });
  assert.strictEqual(igEval.allowed, false, 'Instagram proxying must be BLOCKED_PENDING_APPROVAL');

  // 8.6 Runtime Orchestrator Zero Silent Fallback on Compliance Rejection
  const orchResult = await ProviderOrchestrator.execute('instagram', 'profile', { limit: 5 }, {
    clientTier: 'third_party_developer',
    isFirstParty: false,
  });
  assert.strictEqual(orchResult.success, false, 'Orchestrator must not execute Instagram for unapproved client');
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

  // ── TEST 10: New Providers (Isochrone, IP Geolocation, Frankfurter, GNews) ──
  console.log('\n10. Testing Isochrone, IP Geolocation, Frankfurter, and GNews...');
  const ipEval = ComplianceEngine.evaluate('ip_geolocation', 'utils', 'lookup');
  assert.strictEqual(ipEval.allowed, true, 'IP Geolocation must be approved');

  const frankEval = ComplianceEngine.evaluate('frankfurter', 'finance', 'rates');
  assert.strictEqual(frankEval.allowed, true, 'Frankfurter must be approved');

  const gnewsEval = ComplianceEngine.evaluate('gnews', 'news', 'search');
  assert.strictEqual(gnewsEval.allowed, true, 'GNews must be approved');

  const mbIsochroneEval = ComplianceEngine.evaluate('mapbox', 'maps', 'isochrone');
  assert.strictEqual(mbIsochroneEval.allowed, true, 'Mapbox isochrone must be approved');

  // Test IP Geolocation execution
  const ipRes = await ProviderOrchestrator.execute('utils', 'lookup', { ip: '8.8.8.8' }, { specificProvider: 'ip_geolocation' });
  assert.strictEqual(ipRes.success, true, 'IP Geolocation lookup should succeed');
  assert.strictEqual(typeof (ipRes.data as any)?.city, 'string');

  // Test Frankfurter execution
  const frankRes = await ProviderOrchestrator.execute('finance', 'rates', { base: 'USD', target: 'EUR', amount: 10 }, { specificProvider: 'frankfurter' });
  assert.strictEqual(frankRes.success, true, 'Frankfurter rates should succeed');
  assert.strictEqual(typeof (frankRes.data as any)?.rates?.EUR, 'number');

  // Test GNews execution
  const gnewsRes = await ProviderOrchestrator.execute('news', 'search', { q: 'technology' }, { specificProvider: 'gnews' });
  assert.strictEqual(gnewsRes.success, true, 'GNews search should succeed');
  assert.strictEqual(Array.isArray(gnewsRes.data), true);

  // Test Vidora Streaming execution (Movie, TV, Anime)
  const vidoraMovieEval = ComplianceEngine.evaluate('vidora', 'streaming', 'movie');
  assert.strictEqual(vidoraMovieEval.allowed, true, 'Vidora movie streaming must be approved');

  const vidoraRes = await ProviderOrchestrator.execute('streaming', 'movie', { tmdb_id: 786892, primaryColor: 'B20710', autoplay: true }, { specificProvider: 'vidora' });
  assert.strictEqual(vidoraRes.success, true, 'Vidora movie embed should succeed');
  assert.strictEqual((vidoraRes.data as any)?.provider, 'vidora');
  assert.strictEqual((vidoraRes.data as any)?.type, 'movie');
  assert.strictEqual((vidoraRes.data as any)?.embed_url.includes('https://vidora.ac/movie/786892'), true);
  assert.strictEqual((vidoraRes.data as any)?.embed_url.includes('primaryColor=B20710'), true);
  assert.strictEqual((vidoraRes.data as any)?.iframe_tag.startsWith('<iframe'), true);

  const vidoraTvRes = await ProviderOrchestrator.execute('streaming', 'tv', { tmdb_id: 94997, season: 2, episode: 1 }, { specificProvider: 'vidora' });
  assert.strictEqual(vidoraTvRes.success, true, 'Vidora TV embed should succeed');
  assert.strictEqual((vidoraTvRes.data as any)?.embed_url.includes('https://vidora.ac/tv/94997/2/1'), true);

  const vidoraAnimeRes = await ProviderOrchestrator.execute('streaming', 'anime', { mal_id: 5, number: 1, sub_or_dub: 'sub' }, { specificProvider: 'vidora' });
  assert.strictEqual(vidoraAnimeRes.success, true, 'Vidora Anime embed should succeed');
  assert.strictEqual((vidoraAnimeRes.data as any)?.embed_url.includes('https://vidora.ac/anime/5/1/sub'), true);
  console.log('   ✓ All streaming & media embed providers (Vidora) verified and executing cleanly.');
  console.log('   ✓ All 4 new providers verified and executing cleanly.');

  // ── TEST 11: Strict Allowable Providers & Allowable Endpoints Enforcement ──
  console.log('\n11. Testing Strict Allowable Providers & Allowable Endpoints Enforcement...');

  // 11.1 Check Catalog contains all newly added providers
  assert.strictEqual(AllowableCatalog.isAllowableProvider('isochrone') || AllowableCatalog.isAllowableProvider('mapbox'), true, 'Mapbox / isochrone must be in allowable catalog');
  assert.strictEqual(AllowableCatalog.isAllowableProvider('ip_geolocation'), true, 'ip_geolocation must be in allowable catalog');
  assert.strictEqual(AllowableCatalog.isAllowableProvider('frankfurter'), true, 'frankfurter must be in allowable catalog');
  assert.strictEqual(AllowableCatalog.isAllowableProvider('gnews'), true, 'gnews must be in allowable catalog');
  assert.strictEqual(AllowableCatalog.isAllowableProvider('vidora'), true, 'vidora must be in allowable catalog');

  // 11.2 Check Catalog contains all endpoints
  assert.strictEqual(AllowableCatalog.isAllowableEndpoint('/api/v1/maps/isochrone'), true);
  assert.strictEqual(AllowableCatalog.isAllowableEndpoint('/api/v1/utils/ip-lookup'), true);
  assert.strictEqual(AllowableCatalog.isAllowableEndpoint('/api/v1/finance/exchange'), true);
  assert.strictEqual(AllowableCatalog.isAllowableEndpoint('/api/v1/news/search'), true);
  assert.strictEqual(AllowableCatalog.isAllowableEndpoint('/api/v1/streaming/movie'), true);
  assert.strictEqual(AllowableCatalog.isAllowableEndpoint('/api/v1/streaming/tv'), true);
  assert.strictEqual(AllowableCatalog.isAllowableEndpoint('/api/v1/streaming/anime'), true);

  // 11.3 Reject unallowable endpoint via AllowableCatalog
  assert.strictEqual(AllowableCatalog.isAllowableEndpoint('/api/v1/unauthorized/leak-data'), false, 'Unauthorized endpoint must be rejected');

  // 11.4 Test Client with Restricted Allowable Providers
  const restrictedClient = await GatewayDatabase.createClient({
    name: 'Restricted Allowable Client',
    allowedServices: ['weather'],
    allowedProviders: ['open_meteo'], // Only open_meteo allowed!
    allowedEndpoints: ['/api/v1/weather/current'], // Only current weather allowed!
  });

  // Verify that an endpoint NOT in allowedEndpoints is strictly blocked
  const mockUnallowedEndpointReq = {
    headers: new Headers({
      'x-api-key': restrictedClient.rawKey,
    }),
    nextUrl: {
      pathname: '/api/v1/maps/directions', // NOT in allowedEndpoints
      searchParams: new URLSearchParams(),
    },
    url: 'http://localhost:3000/api/v1/maps/directions',
  } as any;

  const endpointCheck = await AuthGuard.verify(mockUnallowedEndpointReq, 'maps');
  assert.strictEqual(endpointCheck.authenticated, false, 'Unallowed endpoint must be blocked');
  assert.strictEqual(endpointCheck.statusCode, 403, 'Must return HTTP 403');
  assert.strictEqual(endpointCheck.error?.code, 'FORBIDDEN_SERVICE', 'Blocked by service/endpoint restriction');

  // Verify that an allowed service but forbidden endpoint is blocked
  const mockUnallowedWeatherForecast = {
    headers: new Headers({
      'x-api-key': restrictedClient.rawKey,
    }),
    nextUrl: {
      pathname: '/api/v1/weather/forecast', // Service is weather, but endpoint is NOT in allowedEndpoints!
      searchParams: new URLSearchParams(),
    },
    url: 'http://localhost:3000/api/v1/weather/forecast',
  } as any;

  const forecastCheck = await AuthGuard.verify(mockUnallowedWeatherForecast, 'weather');
  assert.strictEqual(forecastCheck.authenticated, false, 'Forecast endpoint must be blocked because it is not on allowable list');
  assert.strictEqual(forecastCheck.statusCode, 403, 'Must return HTTP 403');
  assert.strictEqual(forecastCheck.error?.code, 'FORBIDDEN_ENDPOINT', 'Must return FORBIDDEN_ENDPOINT');

  // Verify that requesting an unallowed provider is blocked
  const mockUnallowedProviderReq = {
    headers: new Headers({
      'x-api-key': restrictedClient.rawKey,
    }),
    nextUrl: {
      pathname: '/api/v1/weather/current',
      searchParams: new URLSearchParams({ provider: 'openweather' }), // openweather NOT in allowedProviders!
    },
    url: 'http://localhost:3000/api/v1/weather/current?provider=openweather',
  } as any;

  const providerCheck = await AuthGuard.verify(mockUnallowedProviderReq, 'weather');
  assert.strictEqual(providerCheck.authenticated, false, 'Unallowable provider must be blocked');
  assert.strictEqual(providerCheck.statusCode, 403, 'Must return HTTP 403');
  assert.strictEqual(providerCheck.error?.code, 'FORBIDDEN_PROVIDER', 'Must return FORBIDDEN_PROVIDER');

  // Verify that an allowable endpoint AND allowable provider succeeds
  const mockAllowedReq = {
    headers: new Headers({
      'x-api-key': restrictedClient.rawKey,
    }),
    nextUrl: {
      pathname: '/api/v1/weather/current',
      searchParams: new URLSearchParams({ provider: 'open_meteo' }),
    },
    url: 'http://localhost:3000/api/v1/weather/current?provider=open_meteo',
  } as any;

  const allowedCheck = await AuthGuard.verify(mockAllowedReq, 'weather');
  assert.strictEqual(allowedCheck.authenticated, true, 'Allowable endpoint and provider must be permitted');

  console.log('   ✓ Strict allowable endpoints and allowable providers enforcement verified.');

  console.log('\n🎉 ALL 11 GATEWAY TEST SUITES PASSED CLEANLY!\n');
}

runGatewayTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
