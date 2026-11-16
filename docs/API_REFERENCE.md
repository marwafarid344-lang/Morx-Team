# MORX — Public API Reference (v1)

**Base URL:** `https://YOUR-DOMAIN/api/v1`  
**Authentication Header:** `Authorization: Bearer <MORX_API_KEY>` or `x-api-key: <MORX_API_KEY>`

---

## 1. Video Discovery
### `GET /api/v1/videos/search`
Search across video providers with normalized metadata.

#### Query Parameters:
* `q` (required, string): Search query keyword.
* `limit` (optional, integer, default: 20, max: 50): Results count.
* `page` (optional, string): Pagination token.
* `sort` (optional, string): `relevance` | `date` | `rating` | `viewCount`.
* `published_after` (optional, string): ISO 8601 date.
* `published_before` (optional, string): ISO 8601 date.
* `duration` (optional, string): `any` | `short` | `medium` | `long`.
* `providers` (optional, string): Force specific provider (e.g., `youtube`).
* `no_cache` (optional, boolean): Set `true` to bypass cache.

---

## 2. Weather Service
### `GET /api/v1/weather/current`
Get real-time weather conditions.
* Parameters: `city` (string) OR `lat` & `lon` (numbers), `unit` (`celsius` | `fahrenheit` | `kelvin`).

### `GET /api/v1/weather/forecast`
Get 5-day / 3-hour forecast.
* Parameters: `city` (string) OR `lat` & `lon` (numbers), `unit`.

### `GET /api/v1/weather/air-quality`
Get pollution index and pollutant parts.
* Parameters: `lat` & `lon` (required, numbers).

---

## 3. Maps & Geolocation
### `GET /api/v1/maps/geocode`
Convert address to geographic coordinates.
* Parameters: `address` (required, string).

### `GET /api/v1/maps/reverse-geocode`
Convert coordinates to formatted address.
* Parameters: `lat` & `lon` (required, numbers).

### `GET /api/v1/maps/places`
Discover places and points of interest.
* Parameters: `query` (string) or `lat` & `lon`, `radius` (meters), `type` (place type).

### `GET /api/v1/maps/directions`
Point-to-point turn-by-turn navigation.
* Parameters: `origin` (string/coords), `destination` (string/coords), `mode` (`driving` | `walking` | `bicycling`).

### `GET /api/v1/maps/distance-matrix`
Multi-origin to multi-destination distance & time calculation.
* Parameters: `origins` (pipe-separated), `destinations` (pipe-separated).

---

## 4. Route Optimization
### `POST /api/v1/routes/optimize`
Intelligent stop sequencing using 2-opt TSP heuristics or Google Routes.

#### Request Body:
```json
{
  "origin": { "lat": 31.2001, "lon": 29.9187 },
  "stops": [
    { "id": "A", "lat": 31.2089, "lon": 29.9092 },
    { "id": "B", "lat": 31.2150, "lon": 29.9500 },
    { "id": "C", "lat": 31.1900, "lon": 29.9200 }
  ],
  "destination": { "lat": 31.1800, "lon": 29.9000 },
  "provider": "internal_tsp"
}
```

#### Response Example:
```json
{
  "success": true,
  "service": "routing",
  "data": {
    "optimized_order": ["C", "A", "B"],
    "total_distance_meters": 13550,
    "total_duration_seconds": 1394,
    "algorithm": "internal_tsp_heuristic",
    "provider": "internal_tsp",
    "legs": [...]
  },
  "meta": {
    "provider": "internal_tsp",
    "providers_used": ["internal_tsp"],
    "cached": false,
    "request_id": "req_1740000000_c3d4",
    "timestamp": "2026-10-31T18:00:00.000Z",
    "latency_ms": 2
  },
  "errors": []
}
```

---

## 5. TikTok Display API
* `GET /api/v1/tiktok/user?access_token=...`
* `GET /api/v1/tiktok/videos?access_token=...&limit=20`
* `GET /api/v1/tiktok/videos/:id?access_token=...`

---

## 6. Instagram Platform
* `GET /api/v1/instagram/profile?access_token=...`
* `GET /api/v1/instagram/media?access_token=...&limit=20`
* `GET /api/v1/instagram/media/:id?access_token=...`

