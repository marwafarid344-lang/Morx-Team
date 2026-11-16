# MORX — Deployment & Configuration Guide

## 1. Environment Variables Configuration

Copy the template below into `.env.local` or your production hosting provider environment configuration (Vercel, Railway, Node.js):

```env
# ==============================================================================
# MORX API GATEWAY - ENVIRONMENT CONFIGURATION TEMPLATE
# ==============================================================================

# Gateway Master Key (optional, for administrative client provisioning)
MORX_GATEWAY_MASTER_KEY=morx_master_admin_secret_key_change_in_production

# Video Discovery Service
YOUTUBE_API_KEY=your_google_or_youtube_api_key_here

# Weather Service
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Maps & Geolocation Service
GOOGLE_MAPS_API_KEY=your_google_maps_platform_api_key_here
MAPBOX_ACCESS_TOKEN=your_mapbox_public_or_secret_token_here

# Social Media Services (Optional / Creator OAuth)
TIKTOK_CLIENT_KEY=your_tiktok_client_key_here
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret_here
INSTAGRAM_APP_ID=your_meta_instagram_app_id_here
INSTAGRAM_APP_SECRET=your_meta_instagram_app_secret_here

# Existing Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 2. Database Migration (PostgreSQL / Supabase)
Execute the migration script in your Supabase SQL Editor:
```sql
docs/migrations/001_api_gateway_schema.sql
```
*Note: The Morx Gateway contains resilient in-memory fallback storage, allowing it to function and run test suites even prior to applying database migrations.*

## 3. Verifying Installation & Tests
Run the automated test suite locally:
```bash
npx tsx tests/gateway.test.ts
```

## 4. Accessing the Control Center
Open your browser to:
```text
https://YOUR-DOMAIN/gateway
```
From here you can monitor provider health, issue API keys for your Graduation Project, and test all provider integrations live in the Provider Testing Lab.

