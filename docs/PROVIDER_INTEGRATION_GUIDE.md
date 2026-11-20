# MORX — Provider Integration Guide

This guide details the integration parameters, official documentation, authentication, rate limits, and status of every supported service provider.

---

## 1. YouTube Data API v3 (Videos Service)
* **Provider Identifier:** `youtube`
* **Service Category:** `videos`
* **Official Documentation:** https://developers.google.com/youtube/v3/docs/search/list
* **Authentication:** API Key (`YOUTUBE_API_KEY` or `GOOGLE_API_KEY`).
* **Supported Operations:**
  * `search`: Keyword video search, pagination with `pageToken`, sorting (`relevance`, `date`, `rating`, `viewCount`), date bounds (`published_after`, `published_before`), region and duration filters.
* **Quota & Pricing:**
  * Free quota allocation: 10,000 units/day.
  * Search call cost: 100 quota units.
  * Video details enrichment: 1 quota unit per batch.
* **Implementation Status:** Fully implemented & operational with video details enrichment.

---

## 2. OpenWeather API (Weather Service)
* **Provider Identifier:** `openweather`
* **Service Category:** `weather`
* **Official Documentation:** https://openweathermap.org/api
* **Authentication:** API Key (`OPENWEATHER_API_KEY`).
* **Supported Operations:**
  * `current`: Current weather conditions by latitude/longitude or city name.
  * `forecast`: 5-day / 3-hour forecast intervals.
  * `air_quality`: Air pollution index (AQI 1-5) and pollutant concentrations (`co`, `no2`, `o3`, `pm2_5`, `pm10`).
* **Units Supported:** Celsius (metric), Fahrenheit (imperial), Kelvin (standard).
* **Quota & Pricing:**
  * Free tier: 60 calls/minute, 1,000,000 calls/month.
* **Implementation Status:** Fully implemented & normalized.

---

## 3. Google Maps Platform (Maps Service)
* **Provider Identifier:** `google_maps`
* **Service Category:** `maps`
* **Official Documentation:** https://developers.google.com/maps/documentation
* **Authentication:** API Key (`GOOGLE_MAPS_API_KEY`).
* **Supported Operations:**
  * `geocode`: Address to geographic coordinates.
  * `reverse_geocode`: Latitude and longitude to human-readable address.
  * `places`: Text search and nearby location discovery with radius and place type filters.
  * `directions`: Turn-by-turn routing with distance, duration, steps, and polyline.
  * `distance_matrix`: Many-to-many travel distances and travel times.
* **Implementation Status:** Fully implemented & normalized.

---

## 4. Mapbox (Maps Alternative / Fallback)
* **Provider Identifier:** `mapbox`
* **Service Category:** `maps`
* **Official Documentation:** https://docs.mapbox.com/api/
* **Authentication:** Public / Secret Access Token (`MAPBOX_ACCESS_TOKEN`).
* **Supported Operations:**
  * `geocode`, `reverse_geocode`, `directions`.
* **Implementation Status:** Fully implemented as secondary fallback provider.

---

## 5. Google Routes (Route Optimization Service)
* **Provider Identifier:** `google_routes`
* **Service Category:** `routing`
* **Official Documentation:** https://developers.google.com/maps/documentation/routes
* **Authentication:** API Key (`GOOGLE_MAPS_API_KEY`).
* **Supported Operations:**
  * `optimize`: Multi-stop waypoint sequence optimization (`optimizeWaypoints: true`).
* **Implementation Status:** Fully implemented.

---

## 6. Internal 2-opt TSP Solver (Routing Service Engine)
* **Provider Identifier:** `internal_tsp`
* **Service Category:** `routing`
* **Architecture:** Algorithmic Nearest Neighbor heuristic with 2-opt pairwise exchange optimization.
* **Authentication:** None required (Zero external cost).
* **Supported Operations:**
  * `optimize`: Multi-stop Traveling Salesperson route sequencing with Haversine distance matrix and urban speed estimation.
* **Implementation Status:** Fully operational & unit-tested.

---

## 7. Instagram Platform (Social Service — Reels & Posts Engine)
* **Provider Identifier:** `instagram` (Powered by `apify` as primary, `rapidapi` as automatic fallback)
* **Service Category:** `instagram`
* **Architecture:** Multi-Provider Fallback Strategy Pattern (`InstagramProviderService`).
* **Official Documentation:** 
  * Primary: [Apify Instagram Hashtag Scraper](https://apify.com/apify/instagram-hashtag-scraper)
  * Fallback: [RapidAPI Instagram Scraper](https://rapidapi.com/)
* **Authentication:** 
  * `APIFY_API_TOKEN` (Primary server environment variable)
  * `RAPIDAPI_KEY` (Fallback `x-rapidapi-key` header)
  * `RAPIDAPI_INSTAGRAM_HOST` (Configurable RapidAPI host)
* **Supported Endpoints & Operations:**
  * **Reels Search:** `GET /api/v1/instagram/reels/search` & `GET /api/instagram/reels/search`
    * Parameters: `tag` (required), `limit` (default: 10, max: 30), `sort` (`top` | `recent`), `no_cache` (boolean).
    * Precision Guarantee: Returns strictly playable video stream clips with `video_url`, `duration`, views, likes, and creator owner metadata. Zero static photos.
  * **Posts Search:** `GET /api/v1/instagram/posts/search` & `GET /api/instagram/posts/search`
    * Parameters: `tag` (required), `limit` (default: 10, max: 30), `sort` (`top` | `recent`), `no_cache` (boolean).
    * Precision Guarantee: Returns strictly high-resolution static photography, carousels, and albums (`display_url`, `images` array, captions, likes, comments). Zero video Reels.
  * **Account Media:** `GET /api/v1/instagram/media` (Official Graph API user media).
* **Caching & Performance:**
  * 10-minute in-memory TTL caching via `GatewayCache`.
  * Response times: ~12ms (cached hit), ~800ms - 2s (fresh upstream query).
* **Implementation Status:** Fully implemented, verified, and operational with 0-overlap precision filtering.

---

## 8. Open-Meteo (Weather & Atmospheric Alternative)
* **Provider Identifier:** `open_meteo`
* **Service Category:** `weather`
* **Official Documentation:** https://open-meteo.com/
* **Authentication:** Free tier, no API key required.
* **Supported Operations:**
  * `current`, `forecast` (hourly & daily), `air_quality` (AQI, PM2.5, PM10, ozone).
* **Implementation Status:** Fully implemented as secondary provider for high-availability weather queries.

---

## 9. OSRM Routing Engine (Geospatial Directions)
* **Provider Identifier:** `osrmroute`
* **Service Category:** `routing`
* **Official Documentation:** http://project-osrm.org/
* **Authentication:** Free open routing infrastructure.
* **Supported Operations:**
  * `directions`: Driving, walking, and bicycling turn-by-turn routing with geometry polylines, step distances, and durations.
* **Implementation Status:** Fully implemented & normalized.

---

## 10. Frankfurter & European Central Bank (Financial Service)
* **Provider Identifier:** `frankfurter`
* **Service Category:** `finance`
* **Official Documentation:** https://frankfurter.dev/
* **Authentication:** Free open financial exchange data backed by the European Central Bank (ECB) with automatic fallback to Open Exchange Rates (`open.er-api.com`).
* **Supported Operations:**
  * `exchange`: Convert amounts across 162+ fiat currencies (e.g. USD, EUR, EGP, GBP, JPY, SAR, AED).
* **Implementation Status:** Fully operational with multi-currency fallback engine.

---

## 11. GNews Intelligence (News & Media Service)
* **Provider Identifier:** `gnews`
* **Service Category:** `news`
* **Official Documentation:** https://gnews.io/
* **Authentication:** API Key (`GNEWS_API_KEY`).
* **Supported Operations:**
  * `search`: Breaking news articles, topic filtering, country, language, and publication timestamps.
* **Implementation Status:** Fully implemented & normalized.

---

## 12. IP Geolocation (Network Utility Service)
* **Provider Identifier:** `ip_geolocation`
* **Service Category:** `utils`
* **Official Documentation:** https://ip-api.com/
* **Authentication:** Free tier utility engine.
* **Supported Operations:**
  * `ip_lookup`: Resolve IP addresses to geographic coordinates, city, country, ISP, and timezone metadata.
* **Implementation Status:** Fully implemented & operational.

