# MORX — Security & Data Protection Guidelines

## 1. Credential Segregation
* Downstream provider credentials (`GOOGLE_MAPS_API_KEY`, `OPENWEATHER_API_KEY`, `YOUTUBE_API_KEY`, `MAPBOX_ACCESS_TOKEN`, `TIKTOK_CLIENT_KEY`, `INSTAGRAM_APP_ID`) reside strictly in server-side environment variables.
* Downstream provider API keys are **never** returned in HTTP responses, logs, or sent to frontend components.

## 2. API Key Protection
* Client keys are generated using cryptographically strong pseudo-random bytes (`crypto.randomBytes(24)`).
* Plaintext keys are hashed with SHA-256 before persistence.
* Constant-time buffer comparison (`crypto.timingSafeEqual`) prevents timing oracle attacks.

## 3. SSRF & URL Validation
* The gateway does not accept arbitrary client-supplied remote URLs for data fetching.
* All outbound provider URLs are strictly hardcoded to official HTTPS endpoints:
  * `https://www.googleapis.com/...`
  * `https://api.openweathermap.org/...`
  * `https://maps.googleapis.com/...`
  * `https://api.mapbox.com/...`
  * `https://open.tiktokapis.com/...`
  * `https://graph.instagram.com/...`

## 4. Input Sanitization & Parameter Validation
* Query parameters are strongly cast and bounded (e.g. `limit` capped at 50, coordinates validated as finite numbers).
* HTML instruction markup from Google Directions steps is stripped before returning to clients.

## 5. Denial of Service & Quota Flooding Protection
* Centralized in-memory sliding window rate limiter prevents client flooding.
* Request coalescing collapses duplicate concurrent requests into a single promise.

