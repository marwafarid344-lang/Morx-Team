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

## 7. TikTok Display API (Social Service)
* **Provider Identifier:** `tiktok`
* **Service Category:** `tiktok`
* **Official Documentation:** https://developers.tiktok.com/doc/display-api-overview/
* **Authentication:** OAuth 2.0 User Access Token (`user.info.basic`, `video.list`).
* **Supported Operations:**
  * `user`: Authorized creator profile details.
  * `videos`: Authorized creator video list with pagination cursors.
  * `video_details`: Specific video metadata query by ID.
* **Implementation Status:** Structure, adapters, normalization, and token handling complete (awaits user OAuth token).

---

## 8. Meta Instagram Platform (Social Service)
* **Provider Identifier:** `instagram`
* **Service Category:** `instagram`
* **Official Documentation:** https://developers.facebook.com/documentation/instagram-platform/
* **Authentication:** OAuth 2.0 User / Page Access Token (`instagram_basic`).
* **Supported Operations:**
  * `profile`: Professional/Creator account profile.
  * `media`: Authorized account media feed.
  * `media_details`: Single media item metadata and permalinks.
* **Implementation Status:** Complete adapter & normalizer (awaits authorized access token).

