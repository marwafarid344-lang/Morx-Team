# MORX — Quotas & Rate Limits Architecture

## 1. Client-Side Rate Limits
Every consuming application (e.g., Graduation Project) has independent rate limit quotas configured per client record:
* **Default Rate Limit:** 120 requests/minute, 2,000 requests/hour, 20,000 requests/day.
* **Graduation Project Core Client:** 300 requests/minute, 5,000 requests/hour, 50,000 requests/day.
* **Exceeded Response:** `429 Too Many Requests` with code `RATE_LIMIT_EXCEEDED`.

## 2. External Provider Quota Consumption Tracking
Morx tracks provider-side consumption locally in memory and logs usage to `api_usage`:
* **YouTube Data API:**
  * Standard allocation: 10,000 units/day.
  * Search cost: 100 quota units per call.
  * Videos list enrichment: 1 quota unit.
  * Mitigation: Caching identical queries for 10 minutes (`600s`) reduces search calls by up to 90%.
* **OpenWeather:**
  * Standard allocation: 60 calls/minute, 1,000,000 calls/month.
  * Mitigation: Caching current weather for 5 minutes (`300s`) and forecasts for 15 minutes (`900s`).
* **Google Maps Platform:**
  * \$200 monthly free tier credit.
  * Mitigation: Geocoding responses are cached for 24 hours (`86,400s`); places for 30 minutes (`1,800s`).
* **Internal TSP Engine:**
  * Zero external API quota cost. Always available as fallback for route optimization.

