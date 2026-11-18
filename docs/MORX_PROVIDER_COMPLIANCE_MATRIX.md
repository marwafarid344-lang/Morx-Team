# MORX Unified API Gateway — Provider Compliance, Licensing & Legal Risk Matrix

> **Document Version:** 1.0.0  
> **Status:** MANDATORY LEGAL & CONTRACTUAL SPECIFICATION  
> **Applicability:** All Gateway Orchestrator Pipelines, Provider Adapters, Client Consumers & Storage Systems  
> **Governing Policy:** Provider Terms of Service, Commercial Licenses, Platform Developer Policies, and Multi-Tenant Security Standards.

---

## 1. Executive Summary & Core Doctrine

The possession or technical validity of an API key, OAuth access token, or client secret **does not constitute legal or contractual permission** to:
1. **Proxy or Resell Access:** Re-expose provider APIs as a generalized "API-as-a-Service" to third parties.
2. **Redistribute Proprietary Datasets:** Store, aggregate, or stream provider data outside authorized end-user applications.
3. **Co-mingle Data Illegally:** Combine proprietary assets (e.g., Google Maps content with OpenStreetMap/Mapbox) in ways prohibited by license agreements.
4. **Indefinite Data Retention:** Retain, hoard, or fail to honor mandatory deletion and cache expiration rules.
5. **Unauthorized Scraping:** Access endpoints, web pages, or feeds via undocumented or unauthenticated mechanisms.

**Guiding Rule:** *A technically functional integration is not necessarily an authorized integration. MORX prioritizes contractual compliance, user privacy, and data ownership over feature completeness.*

---

## 2. Global Compliance States

Every provider operation within MORX is explicitly classified under one of five runtime compliance states:

| Status | Definition | Runtime Behavior |
| :--- | :--- | :--- |
| **`APPROVED`** | Fully reviewed and explicitly authorized under active commercial or developer agreement. | Allowed for production traffic under strict rate and retention limits. |
| **`CONDITIONAL`** | Permitted under strict, specific operating constraints (e.g., must render on specified canvas, no reselling, mandatory attribution). | Allowed only when request context matches required compliance parameters. |
| **`INTERNAL_ONLY`** | Allowed exclusively for internal MORX first-party UI/services; forbidden to external third-party API clients. | Blocked for all non-internal API keys. |
| **`BLOCKED_PENDING_APPROVAL`** | Technical integration exists or is tested, but external redistribution or current architecture lacks explicit written approval. | **Blocked at runtime with `PROVIDER_COMPLIANCE_RESTRICTION`. Silent fallback is strictly prohibited.** |
| **`DISABLED`** | Decommissioned, prohibited by terms, or revoked. | Permanently rejected with `PROVIDER_DISABLED`. |

---

## 3. Comprehensive Provider Compliance Matrix

---

### 3.1. YouTube (Google LLC / Alphabet)

* **Official Documentation:** [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
* **Applicable Agreement:** [YouTube API Services Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service) & [Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
* **Current Gateway Status:** **`BLOCKED_PENDING_APPROVAL`** (External Third-Party Proxying) / **`INTERNAL_ONLY`** (First-Party Morx UI with IFrame Embed Player)

#### Detailed Compliance Analysis
1. **What the Provider Permits:**
   * Fetching video metadata, search results, and channel info for direct display within an authorized client application.
   * Playing videos exclusively via official YouTube Embedded Players (iframe API, Android/iOS player SDKs).
   * In-memory caching of metadata solely for temporary performance optimization (up to 30 days maximum, subject to immediate refresh).
2. **What the Provider Prohibits:**
   * **API Proxying as a Service (Policy III.A):** Offering an API service or backend proxy that allows third-party developers or arbitrary clients to access YouTube API Services or Data indirectly.
   * **Audiovisual Content Separation/Caching (Policy III.D.2):** Downloading, storing, separating audio from video, or streaming video streams directly without the YouTube player.
   * **Aggregation Across Content Owners:** Aggregating data across unrelated creators without explicit consent.
   * **Indefinite Storage (Policy III.E):** Retaining API data without regular refresh cycles or beyond 30 days.
   * **Metric Distortion:** Fabricating or falsifying views, likes, or user engagement metrics.
3. **Internal Morx Use:**
   * **Permitted:** Morx web/mobile app displaying curated educational/sports videos via official YouTube IFrame player.
4. **External Client Exposure:**
   * **STRICTLY BLOCKED:** Exposing `/api/v1/videos/search` to arbitrary external developers as a proxy service is prohibited under Policy Section III.A.
5. **Required Approval:** Explicit written approval from Google/YouTube Partner Program is mandatory before offering any proxying capabilities.
6. **Credentials & Permissions:** Valid Google Cloud API Key with YouTube Data API v3 scope or OAuth 2.0 Client credentials.
7. **Data Retention & Caching Restrictions:**
   * **Max TTL:** 30 calendar days for video metadata; mandatory invalidation if video/channel is deleted.
   * **Audiovisual Caching:** STRICTLY ZERO (0) ms. Never buffer, cache, or store `.mp4`, `.webm`, or raw audio streams.
8. **Attribution Obligations:**
   * Mandatory "Powered by YouTube" badge with official YouTube logo and active hyperlink to `https://www.youtube.com`.
   * Clear link to YouTube Terms of Service and Google Privacy Policy.
9. **Remaining Compliance Uncertainties:**
   * Need formal confirmation on whether Morx Enterprise student graduation project showcase qualifies as educational fair use or commercial distribution.

---

### 3.2. Google Maps Platform (Google LLC)

* **Official Documentation:** [Google Maps Platform Documentation](https://developers.google.com/maps)
* **Applicable Agreement:** [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms) & [Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)
* **Current Gateway Status:** **`CONDITIONAL`** (Must satisfy canvas rendering & separate storage boundaries)

#### Detailed Compliance Analysis
1. **What the Provider Permits:**
   * Geocoding, reverse geocoding, places search, and directions for end-user visual routing and address verification.
   * Temporary caching of `place_id` values and geocoded coordinates to optimize repeat user queries.
2. **What the Provider Prohibits:**
   * **Co-mingling with Non-Google Maps (Terms §3.2.3):** Displaying Google Maps Content (geocodes, directions, place reviews) on top of a non-Google map (e.g., OpenStreetMap, Mapbox, Leaflet).
   * **Exporting / Data Extraction (Terms §3.2.4):** Bulk exporting, scraping, or mass downloading of Google Maps content to build a competing spatial database.
   * **Permanent Storage:** Caching geocoding responses, street view imagery, or place details beyond 30 days.
   * **Asset Tracking without Mobility License:** Real-time fleet tracking requires specialized Google Maps Mobility licensing.
3. **Internal Morx Use:**
   * **Permitted:** Internal address resolution and team meetup mapping, provided rendering occurs on official Google Maps canvas.
4. **External Client Exposure:**
   * **Conditional:** Allowed only for enterprise clients who supply their own Google Cloud Project credentials or under signed Enterprise terms.
5. **Required Approval:** Self-serve API enablement with billing account; Enterprise agreement required for sublicensing.
6. **Credentials & Permissions:** API Key restricted by HTTP Referrer / IP Address with Geocoding and Places API enabled.
7. **Data Retention & Caching Restrictions:**
   * **Max TTL:** 30 days strictly for `place_id` and `lat/lng`.
   * **Prohibited:** Storing address components, formatted addresses, reviews, or photos permanently.
8. **Attribution Obligations:**
   * Mandatory Google logo display on all maps. "Powered by Google" text label adjacent to any standalone geocoding/places result.
9. **Remaining Compliance Uncertainties:**
   * Morx Gateway automatically fails over between Google Maps and Mapbox. The Orchestrator must enforce strict isolation to prevent mixing Google responses with Mapbox canvases.

---

### 3.3. Mapbox (Mapbox, Inc.)

* **Official Documentation:** [Mapbox API Documentation](https://docs.mapbox.com/api/)
* **Applicable Agreement:** [Mapbox Terms of Service](https://www.mapbox.com/legal/tos) & [Product Terms](https://www.mapbox.com/legal/product-terms)
* **Current Gateway Status:** **`APPROVED`** (General Routing & Geocoding with Attribution)

#### Detailed Compliance Analysis
1. **What the Provider Permits:**
   * Forward and reverse geocoding (`mapbox.places`).
   * Turn-by-turn navigation, matrix routing, and static/vector map tile rendering.
   * Integration into web, mobile, and server applications under standard pay-as-you-go or enterprise commitments.
   * Permanent storage of geocoded results is allowed under specialized "Permanent Geocoding" endpoints (`/mapbox.places-permanent`).
2. **What the Provider Prohibits:**
   * Utilizing standard temporary geocoding endpoints for permanent database storage.
   * Sublicensing or redistributing vector map tiles outside client application sessions.
   * Re-engineering or reverse compiling proprietary Mapbox routing engines.
3. **Internal Morx Use:**
   * **Permitted:** Full usage for team logistics, event geolocation, and fallback routing.
4. **External Client Exposure:**
   * **Permitted:** Unified Geocoding and Route Optimization APIs via Morx Gateway under Enterprise rate limits.
5. **Required Approval:** None beyond valid Mapbox Account and funded token.
6. **Credentials & Permissions:** Secret access token (`sk.*`) for backend server calls; public token (`pk.*`) for client-side tiles.
7. **Data Retention & Caching Restrictions:**
   * **Standard Endpoints:** Max cache TTL of 30 days.
   * **Permanent Endpoints:** Permitted indefinitely if flagged with `permanent=true` license tier.
8. **Attribution Obligations:**
   * Mandatory attribution text: `© Mapbox © OpenStreetMap` with active hyperlinks to `https://www.mapbox.com/about/maps/` and `https://www.openstreetmap.org/copyright`.
9. **Remaining Compliance Uncertainties:**
   * Verification of whether high-volume TSP optimization requires Mapbox Optimization API vs internal TSP solver.

---

### 3.4. OpenWeather (OpenWeather Ltd.)

* **Official Documentation:** [OpenWeather API Documentation](https://openweathermap.org/api)
* **Applicable Agreement:** [OpenWeather Terms and Conditions](https://openweathermap.org/terms) & [Open Data License](https://openweathermap.org/guide)
* **Current Gateway Status:** **`CONDITIONAL`** (Internal and Enterprise Apps with Attribution; No Raw Dataset Resale)

#### Detailed Compliance Analysis
1. **What the Provider Permits:**
   * Querying current weather, 5-day / 3-hour forecasts, and air pollution indices.
   * Displaying weather widgets and integrating weather factors into team planning and travel algorithms.
   * Short-term caching to mitigate rate limits and handle network flakiness.
2. **What the Provider Prohibits:**
   * **Raw Resale:** Sublicensing, reselling, or leasing raw OpenWeather database feeds to competitors.
   * Exceeding subscription tier request quotas (60 calls/min on Free tier).
   * Misrepresenting OpenWeather data as proprietary Morx meteorological forecasting models.
3. **Internal Morx Use:**
   * **Permitted:** Weather condition banners, team outdoor event scheduling.
4. **External Client Exposure:**
   * **Conditional:** Permitted as normalized telemetry (`/api/v1/weather/*`) under Enterprise rate controls with caching.
5. **Required Approval:** Standard API subscription; Enterprise contract required for SLA-backed redistributions.
6. **Credentials & Permissions:** Valid 32-character hexadecimal `OPENWEATHER_API_KEY`.
7. **Data Retention & Caching Restrictions:**
   * **Current Weather:** Max TTL: 10 minutes (meteorological data becomes stale rapidly).
   * **5-Day Forecast:** Max TTL: 3 hours.
   * **Historical Archive:** Zero retention without Historical Weather subscription tier.
8. **Attribution Obligations:**
   * Mandatory citation: "Weather data provided by OpenWeather" with hyperlink to `https://openweathermap.org`.
9. **Remaining Compliance Uncertainties:**
   * Clarification on whether educational graduation project presentation constitutes non-commercial fair use under standard terms.

---

### 3.5. TikTok (ByteDance Ltd. / TikTok Inc.)

* **Official Documentation:** [TikTok for Developers](https://developers.tiktok.com/)
* **Applicable Agreement:** [TikTok Developer Terms of Service](https://www.tiktok.com/legal/developer-terms-of-service) & [Developer Guidelines](https://developers.tiktok.com/docs/en/our-guidelines/developer-guidelines)
* **Current Gateway Status:** **`BLOCKED_PENDING_APPROVAL`** (Awaiting Tech Provider Registration & App Review)

#### Detailed Compliance Analysis
1. **What the Provider Permits:**
   * Authorized user authentication via Login Kit with explicit creator consent.
   * Sharing content to TikTok via Share Kit.
   * Accessing public video metadata strictly via official Display API for authenticated creators.
2. **What the Provider Prohibits:**
   * **Automated Scraping:** Any unauthenticated crawling, headless browser scraping, or private API reverse engineering.
   * **Unapproved Multi-Tenant Proxying:** Exposing creator data to third-party clients without TikTok App Review approval as an accredited "Tech Provider".
   * **Data Transfer:** Transferring platform data to data brokers or ad networks.
   * **Biometric Extraction:** Using video frames or audio for facial recognition, voice profiling, or AI training without explicit permission.
3. **Internal Morx Use:**
   * **Conditional:** Permitted only when a creator explicitly connects their TikTok account via OAuth 2.0.
4. **External Client Exposure:**
   * **STRICTLY BLOCKED:** Third-party developer proxy access is blocked until Morx undergoes TikTok Commercial Developer Review.
5. **Required Approval:** Mandatory TikTok Developer App Review, Security Assessment, and Commercial Partnership Agreement.
6. **Credentials & Permissions:** `Client Key`, `Client Secret`, User Access Token with approved scopes (`user.info.basic`, `video.list`).
7. **Data Retention & Caching Restrictions:**
   * All cached user data must be refreshed every 24 hours.
   * Immediate, verifiable deletion upon user account disconnection or webhook revocation notice.
8. **Attribution Obligations:**
   * Official TikTok wordmark and icon must accompany any displayed content.
9. **Remaining Compliance Uncertainties:**
   * Morx multi-tenant architecture requires legal classification as a "Tech Provider" under TikTok's enterprise framework.

---

### 3.6. Instagram / Meta Platform (Meta Platforms, Inc.)

* **Official Documentation:** [Instagram Platform Documentation](https://developers.facebook.com/documentation/instagram-platform/)
* **Applicable Agreement:** [Meta Platform Terms](https://developers.facebook.com/terms/) & [Developer Policies](https://developers.facebook.com/devpolicy/)
* **Current Gateway Status:** **`BLOCKED_PENDING_APPROVAL`** (Requires Meta App Review & Business Verification)

#### Detailed Compliance Analysis
1. **What the Provider Permits:**
   * Accessing media, insights, and profile data for accounts that have explicitly authorized the application via OAuth.
   * Publishing content on behalf of authorized professional/business Instagram accounts.
2. **What the Provider Prohibits:**
   * **Scraping / Crawling (Terms §3.a):** Scraping public posts, profile pictures, comments, or hashtags without API authorization.
   * **Sharing Platform Data Across Clients (Terms §4):** Sublicensing, proxying, or co-mingling client data without distinct user authorization.
   * **Proxying API Keys:** Allowing third-party developers to access the Graph API using Morx master credentials.
   * **Indefinite Data Storage:** Retaining user data after app deletion, de-authorization, or account closure.
3. **Internal Morx Use:**
   * **Conditional:** First-party user social link verification via official OAuth 2.0.
4. **External Client Exposure:**
   * **STRICTLY BLOCKED:** Exposing Instagram endpoints (`/api/v1/social/instagram/*`) as a generic API service is prohibited by Meta Platform Terms.
5. **Required Approval:** Meta Business Verification, App Review for permissions (`instagram_basic`, `instagram_manage_insights`).
6. **Credentials & Permissions:** Valid App ID, App Secret, verified Business Manager, and Short/Long-Lived User Access Tokens.
7. **Data Retention & Caching Restrictions:**
   * Caching allowed for performance (up to 24 hours max).
   * Mandatory implementation of the **Data Deletion Request Callback** endpoint.
8. **Attribution Obligations:**
   * Official Instagram logo and trademark guidelines; direct links back to original post permalinks.
9. **Remaining Compliance Uncertainties:**
   * Compliance requirement for Data Deletion Request Callback URL verification in Meta Developer portal.

---

### 3.7. Internal Route & TSP Optimization Engine (Proprietary Morx)

* **Official Documentation:** Morx Gateway Internal TSP Specification
* **Applicable Agreement:** Proprietary Morx Software License
* **Current Gateway Status:** **`APPROVED`** (Fully Owned IP)

#### Detailed Compliance Analysis
1. **What the Provider Permits:**
   * Uncapped execution of Traveling Salesman Problem (TSP) multi-stop delivery/travel routing.
   * Complete redistribution and API exposure to all enterprise clients.
2. **What the Provider Prohibits:**
   * None (internal proprietary code).
3. **Internal Morx Use:** **APPROVED**
4. **External Client Exposure:** **APPROVED**
5. **Required Approval:** None (internal IP).
6. **Credentials & Permissions:** Standard Morx API Key (`morx_live_*`).
7. **Data Retention & Caching Restrictions:**
   * Distance matrix caching up to 24 hours.
8. **Attribution Obligations:** None.

---

## 4. Runtime Enforcement Architecture

```
Client API Request
       │
       ▼
[ Gateway Auth Guard ]  ──(Invalid Key)──▶ Return 401 Unauthorized
       │
       ▼
[ Compliance Engine ]  ──(Violates Policy / BLOCKED_PENDING_APPROVAL)──▶ Return 403 Forbidden
       │                                                                  ("PROVIDER_COMPLIANCE_RESTRICTION")
       │ (Passed Compliance)
       ▼
[ Rate Limiter & Circuit Breaker ]
       │
       ▼
[ Intelligent Provider Pipeline ]
       │
       ├─▶ Provider A (Primary)
       │       │
       │   (Fails Technically: 502/Timeout)
       │       ▼
       └─▶ Provider B (Fallback with STRICT Compliance Isolation)
               │
               ▼
   [ Response Normalizer + Mandatory Attribution Injection ]
               │
               ▼
        Client Response (200 OK + Attribution Metadata)
```

### Critical Enforcement Principles
1. **Zero Silent Bypass:** When a provider is flagged `BLOCKED_PENDING_APPROVAL`, `INTERNAL_ONLY`, or `DISABLED`, the Compliance Engine **immediately rejects the request**. It will never fall back to another provider to bypass a legal restriction.
2. **Client Tier Awareness:**
   * `INTERNAL`: First-party Morx portal.
   * `ENTERPRISE`: Contracted enterprise partner with verified compliance addendum.
   * `DEVELOPER`: Third-party consuming applications (subject to maximum restriction).
3. **Mandatory Attribution Injection:** Every successful response from an approved provider must include normalized attribution headers and metadata payload (e.g., `meta.attribution`).

---

## 5. Compliance Review & Governance Schedule

* **Cadence:** Quarterly contractual review and immediate audit upon any provider terms revision.
* **Responsible Roles:** Lead Systems Architect, Chief Compliance Officer, Gateway Engineering Team.
* **Emergency Protocol:** Any cease-and-desist, policy warning, or developer account suspension triggers automated status switch to `DISABLED` across all cluster instances within 60 seconds.

---

*Certified compliant with MORX Unified API Gateway Architecture Standards.*
