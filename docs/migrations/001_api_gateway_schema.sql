-- ==============================================================================
-- MORX UNIFIED API GATEWAY & PROVIDER INTELLIGENCE PLATFORM
-- Database Schema Migration (PostgreSQL / Supabase)
-- Version: 1.0.0
-- ==============================================================================

-- 1. API Clients (Consuming applications e.g. Graduation Project)
CREATE TABLE IF NOT EXISTS public.api_clients (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    rate_limit_per_minute INT NOT NULL DEFAULT 120,
    rate_limit_per_hour INT NOT NULL DEFAULT 2000,
    rate_limit_per_day INT NOT NULL DEFAULT 20000,
    allowed_services JSONB NOT NULL DEFAULT '["*"]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. API Keys (Hashed with SHA-256)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id VARCHAR(64) PRIMARY KEY,
    client_id VARCHAR(64) NOT NULL REFERENCES public.api_clients(id) ON DELETE CASCADE,
    key_prefix VARCHAR(32) NOT NULL,
    key_hash VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_client ON public.api_keys(client_id);

-- 3. Providers Catalog
CREATE TABLE IF NOT EXISTS public.providers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    service VARCHAR(64) NOT NULL,
    priority INT NOT NULL DEFAULT 100,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'maintenance')),
    configuration JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_providers_service ON public.providers(service);

-- 4. Provider Health & Latency History
CREATE TABLE IF NOT EXISTS public.provider_health (
    id BIGSERIAL PRIMARY KEY,
    provider_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
    latency_ms INT NOT NULL DEFAULT 0,
    error_message TEXT,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_provider_health_lookup ON public.provider_health(provider_id, last_checked_at DESC);

-- 5. API Request Usage & Analytics Logs
CREATE TABLE IF NOT EXISTS public.api_usage (
    id BIGSERIAL PRIMARY KEY,
    client_id VARCHAR(64) REFERENCES public.api_clients(id) ON DELETE SET NULL,
    provider_id VARCHAR(64) NOT NULL,
    service VARCHAR(64) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    status_code INT NOT NULL,
    latency_ms INT NOT NULL,
    cached BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_usage_client ON public.api_usage(client_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_service ON public.api_usage(service);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON public.api_usage(created_at DESC);

-- Seed Default Graduation Project Client
INSERT INTO public.api_clients (id, name, description, status, rate_limit_per_minute, allowed_services)
VALUES (
    'client_grad_project_01',
    'Graduation Project Core Client',
    'Primary Unified Integration Layer for Graduation Project (Videos, Weather, Maps, Routing)',
    'active',
    300,
    '["*"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Providers Catalog
INSERT INTO public.providers (id, name, service, priority, status, configuration)
VALUES
    ('youtube', 'YouTube Data API v3', 'videos', 100, 'active', '{"quotaCostPerCall": 100}'::jsonb),
    ('openweather', 'OpenWeather API', 'weather', 100, 'active', '{"units": "metric"}'::jsonb),
    ('google_maps', 'Google Maps Platform', 'maps', 100, 'active', '{"services": ["geocode", "places", "directions"]}'::jsonb),
    ('mapbox', 'Mapbox API', 'maps', 80, 'active', '{"services": ["geocode", "directions"]}'::jsonb),
    ('google_routes', 'Google Routes Optimizer', 'routing', 100, 'active', '{"algorithm": "waypoints_optimization"}'::jsonb),
    ('internal_tsp', 'Internal 2-opt TSP Solver', 'routing', 50, 'active', '{"zeroCost": true}'::jsonb),
    ('tiktok', 'TikTok Display API', 'tiktok', 100, 'active', '{"authType": "oauth2"}'::jsonb),
    ('instagram', 'Meta Instagram Graph API', 'instagram', 100, 'active', '{"authType": "oauth2"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

