# MORX — Provider Capabilities Matrix

| Provider | Service | Auth Type | Supported Operations | Supported Filters | Pagination | Max Limit | Default Priority |
|---|---|---|---|---|---|---|---|
| **YouTube** | `videos` | API Key | `search` | `q`, `limit`, `page`, `sort`, `published_after`, `published_before`, `region`, `duration` | Yes (`pageToken`) | 50 | 100 |
| **OpenWeather** | `weather` | API Key | `current`, `forecast`, `air_quality` | `lat`, `lon`, `city`, `unit` | No | - | 100 |
| **Google Maps** | `maps` | API Key | `geocode`, `reverse_geocode`, `places`, `directions`, `distance_matrix` | `address`, `lat`, `lon`, `query`, `radius`, `type`, `origin`, `destination`, `mode`, `waypoints` | Yes | 60 | 100 |
| **Mapbox** | `maps` | Bearer Token | `geocode`, `reverse_geocode`, `directions` | `address`, `lat`, `lon`, `origin`, `destination` | No | - | 80 |
| **Google Routes** | `routing` | API Key | `optimize` | `origin`, `destination`, `stops`, `mode` | No | - | 100 |
| **Internal TSP** | `routing` | None | `optimize` | `origin`, `destination`, `stops` | No | - | 50 |
| **Instagram** | `instagram` | API Key / Token | `reels_search`, `posts_search` | `tag`, `limit`, `sort` | No | 30 | 120 |

