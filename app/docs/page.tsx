"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { 
  BookOpen, 
  Search, 
  Key, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Terminal, 
  Code2, 
  Sparkles, 
  ChevronRight, 
  Zap, 
  Globe, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Server,
  Activity,
  FileJson,
  Navigation,
  Compass,
  CloudSun,
  Video,
  Share2,
  DollarSign,
  Newspaper,
  Cpu
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import {
  YouTubeLogo,
  TikTokLogo,
  InstagramLogo,
  GoogleMapsLogo,
  OpenWeatherLogo,
  OSRMRouteLogo,
  FrankfurterLogo,
  GNewsLogo,
  IpGeolocationLogo,
  ProviderBrandLogo,
} from "@/components/gateway/provider-logos"

// =============================================================================
// API ENDPOINTS DOCUMENTATION DATA MODEL
// =============================================================================

interface ParamDoc {
  name: string
  type: string
  required: boolean
  defaultVal?: string
  desc: string
  example?: string
}

interface EndpointDoc {
  id: string
  path: string
  method: "GET" | "POST"
  title: string
  category: "videos" | "weather" | "maps" | "routing" | "finance" | "news" | "utils" | "social" | "system"
  serviceName: string
  providers: string[]
  cacheTtl: string
  rateLimit: string
  summary: string
  detailsText: string
  params: ParamDoc[]
  bodySchema?: string
  responseExplanation: string
  responseSample: Record<string, any>
  curlSnippet: string
  jsSnippet: string
  pythonSnippet: string
  dartSnippet: string
}

const ENDPOINTS_DOCUMENTATION: EndpointDoc[] = [
  // ---------------------------------------------------------------------------
  // 1. VIDEOS SERVICE
  // ---------------------------------------------------------------------------
  {
    id: "videos-search",
    path: "/api/v1/videos/search",
    method: "GET",
    title: "Video Search & Metadata Discovery",
    category: "videos",
    serviceName: "Video Discovery",
    providers: ["YouTube Data API v3"],
    cacheTtl: "10m Cache",
    rateLimit: "120 req/min",
    summary: "Searches YouTube videos with unified metadata, view counts, creator info, and duration filters.",
    detailsText: "This endpoint proxies searches to YouTube Data API v3 while stripping out unnecessary wrapper structures and enriching results with batch-fetched video statistics (view counts, like counts, durations). Identical search queries are cached in memory for 10 minutes to save upstream YouTube quotas. Perfect for VoyageMind destination video guides and visual travel recommendations.",
    params: [
      { name: "q", type: "string", required: true, desc: "Search query keyword or topic (e.g., 'Alexandria Egypt Tourism').", example: "Alexandria Egypt" },
      { name: "limit", type: "number", required: false, defaultVal: "20", desc: "Maximum number of video items to return (1 to 50).", example: "5" },
      { name: "page", type: "string", required: false, desc: "Pagination token from a previous call's meta.next_page.", example: "CAUQAA" },
      { name: "sort", type: "string", required: false, defaultVal: "relevance", desc: "Sorting order: 'relevance' | 'date' | 'rating' | 'viewCount'.", example: "viewCount" },
      { name: "duration", type: "string", required: false, defaultVal: "any", desc: "Duration filter: 'any' | 'short' (<4m) | 'medium' (4-20m) | 'long' (>20m).", example: "medium" },
    ],
    responseExplanation: "Returns an array of standardized video items inside `data`. Each item includes `id`, `title`, `description`, `published_at`, `channel: { id, title }`, `thumbnails: { default, medium, high }`, and enriched `statistics: { view_count, like_count }`.",
    responseSample: {
      success: true,
      service: "videos",
      data: [
        {
          id: "W_v1v0kF17E",
          title: "Top 10 Things to Do in Alexandria, Egypt",
          description: "Discover the Citadel of Qaitbay, Bibliotheca Alexandrina, and Mediterranean corniche.",
          published_at: "2026-05-12T14:30:00Z",
          channel: { id: "UC12345678", title: "Travel Guides International" },
          thumbnails: {
            medium: "https://i.ytimg.com/vi/W_v1v0kF17E/mqdefault.jpg",
            high: "https://i.ytimg.com/vi/W_v1v0kF17E/hqdefault.jpg"
          },
          statistics: { view_count: 342100, like_count: 14200, duration_seconds: 524 }
        }
      ],
      meta: { provider: "youtube", cached: true, latency_ms: 18, request_id: "req_vid_8912", timestamp: "2026-11-19T12:00:00Z" },
      errors: []
    },
    curlSnippet: `curl -X GET "https://morx-team.vercel.app/api/v1/videos/search?q=Alexandria+Egypt&limit=5" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsSnippet: `const response = await fetch("https://morx-team.vercel.app/api/v1/videos/search?q=Alexandria+Egypt&limit=5", {
  headers: {
    "Authorization": "Bearer YOUR_MORX_API_KEY",
    "Content-Type": "application/json"
  }
});
const { data, meta } = await response.json();
console.log(data); // Array of normalized video items`,
    pythonSnippet: `import requests

url = "https://morx-team.vercel.app/api/v1/videos/search"
headers = {"Authorization": "Bearer YOUR_MORX_API_KEY"}
params = {"q": "Alexandria Egypt", "limit": 5}

response = requests.get(url, headers=headers, params=params)
data = response.json()["data"]`,
    dartSnippet: `import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> searchVideos() async {
  final url = Uri.parse('https://morx-team.vercel.app/api/v1/videos/search?q=Alexandria+Egypt&limit=5');
  final res = await http.get(url, headers: {
    'Authorization': 'Bearer YOUR_MORX_API_KEY',
  });
  final json = jsonDecode(res.body);
  print(json['data']);
}`
  },

  // ---------------------------------------------------------------------------
  // 2. WEATHER SERVICE: CURRENT
  // ---------------------------------------------------------------------------
  {
    id: "weather-current",
    path: "/api/v1/weather/current",
    method: "GET",
    title: "Current Weather Conditions",
    category: "weather",
    serviceName: "Weather Intelligence",
    providers: ["OpenWeather API", "Open-Meteo (Failover)"],
    cacheTtl: "15m Cache",
    rateLimit: "120 req/min",
    summary: "Fetches live temperature, weather code, humidity, wind, and atmospheric conditions.",
    detailsText: "Provides real-time weather observations by city name or exact latitude/longitude coordinates. The Morx Gateway dynamically queries OpenWeather with automatic zero-downtime failover to Open-Meteo. You can specify `provider=open_meteo` or `provider=openweather` in query params if you prefer a specific backend. Results are cached for 15 minutes.",
    params: [
      { name: "city", type: "string", required: false, desc: "City name to query (e.g. 'Alexandria', 'Cairo', 'London').", example: "Alexandria" },
      { name: "lat", type: "number", required: false, desc: "Latitude coordinate (-90 to 90). Used if city is omitted.", example: "31.2001" },
      { name: "lon", type: "number", required: false, desc: "Longitude coordinate (-180 to 180). Required if lat is passed.", example: "29.9187" },
      { name: "unit", type: "string", required: false, defaultVal: "metric", desc: "Temperature unit: 'metric' (Celsius) or 'imperial' (Fahrenheit).", example: "metric" },
      { name: "provider", type: "string", required: false, defaultVal: "auto", desc: "Specific provider override: 'openweather' | 'open_meteo'.", example: "open_meteo" },
    ],
    responseExplanation: "Returns a normalized `data` object with location details (`city`, `country`, `coordinates`), current observation (`temperature`, `feels_like`, `temp_min`, `temp_max`, `humidity`, `pressure`, `wind: { speed, deg }`, `condition: { main, description, icon }`), and daylight markers (`sunrise`, `sunset`).",
    responseSample: {
      success: true,
      service: "weather",
      data: {
        location: { city: "Alexandria", country: "EG", coordinates: { lat: 31.2001, lon: 29.9187 } },
        current: {
          temperature: 24.5,
          feels_like: 25.1,
          temp_min: 22.0,
          temp_max: 26.2,
          humidity: 62,
          pressure: 1014,
          wind: { speed: 4.8, deg: 320, unit: "m/s" },
          condition: { main: "Clear", description: "clear sky", code: 800, icon: "01d" }
        },
        daylight: { sunrise: "2026-11-19T04:35:00Z", sunset: "2026-11-19T15:02:00Z" }
      },
      meta: { provider: "open_meteo", cached: false, latency_ms: 65, request_id: "req_wth_2145", timestamp: "2026-11-19T12:00:00Z" },
      errors: []
    },
    curlSnippet: `curl -X GET "https://morx-team.vercel.app/api/v1/weather/current?city=Alexandria" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsSnippet: `const res = await fetch("https://morx-team.vercel.app/api/v1/weather/current?city=Alexandria", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(\`Current Temp: \${data.current.temperature}°C, \${data.current.condition.description}\`);`,
    pythonSnippet: `import requests

res = requests.get(
    "https://morx-team.vercel.app/api/v1/weather/current",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"},
    params={"city": "Alexandria"}
)
weather = res.json()["data"]["current"]
print(f"Temperature: {weather['temperature']} C")`,
    dartSnippet: `final res = await http.get(
  Uri.parse('https://morx-team.vercel.app/api/v1/weather/current?city=Alexandria'),
  headers: {'Authorization': 'Bearer YOUR_MORX_API_KEY'},
);
final weather = jsonDecode(res.body)['data']['current'];
print('Temperature: \${weather['temperature']}°C');`
  },

  // ---------------------------------------------------------------------------
  // 3. WEATHER SERVICE: FORECAST
  // ---------------------------------------------------------------------------
  {
    id: "weather-forecast",
    path: "/api/v1/weather/forecast",
    method: "GET",
    title: "5-Day / 7-Day Weather Forecast",
    category: "weather",
    serviceName: "Weather Intelligence",
    providers: ["OpenWeather API", "Open-Meteo"],
    cacheTtl: "30m Cache",
    rateLimit: "120 req/min",
    summary: "Retrieves extended multi-day weather predictions with daily temperature ranges and conditions.",
    detailsText: "Provides day-by-day and 3-hour interval forecast models for itinerary trip planning. Perfect for the VoyageMind itinerary engine to advise travelers on packing, optimal touring days, and indoor vs. outdoor scheduling.",
    params: [
      { name: "city", type: "string", required: false, desc: "Target city name (e.g. 'Cairo', 'Luxor').", example: "Cairo" },
      { name: "lat", type: "number", required: false, desc: "Latitude coordinate.", example: "30.0444" },
      { name: "lon", type: "number", required: false, desc: "Longitude coordinate.", example: "31.2357" },
      { name: "days", type: "number", required: false, defaultVal: "5", desc: "Forecast length in days (1 to 7).", example: "5" },
    ],
    responseExplanation: "Returns `data.daily` array containing forecasted days with `date`, `temp_min`, `temp_max`, `condition`, and `precipitation_probability`.",
    responseSample: {
      success: true,
      service: "weather",
      data: {
        location: { city: "Cairo", country: "EG" },
        daily: [
          { date: "2026-11-20", temp_min: 16.2, temp_max: 27.5, condition: "Sunny", pop: 0 },
          { date: "2026-11-21", temp_min: 17.0, temp_max: 28.1, condition: "Partly Cloudy", pop: 10 }
        ]
      },
      meta: { provider: "openweather", cached: true, latency_ms: 12, timestamp: "2026-11-19T12:00:00Z" },
      errors: []
    },
    curlSnippet: `curl -X GET "https://morx-team.vercel.app/api/v1/weather/forecast?city=Cairo&days=5" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsSnippet: `const res = await fetch("https://morx-team.vercel.app/api/v1/weather/forecast?city=Cairo&days=5", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(data.daily);`,
    pythonSnippet: `res = requests.get(
    "https://morx-team.vercel.app/api/v1/weather/forecast",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"},
    params={"city": "Cairo", "days": 5}
)
print(res.json()["data"]["daily"])`,
    dartSnippet: `final res = await http.get(
  Uri.parse('https://morx-team.vercel.app/api/v1/weather/forecast?city=Cairo&days=5'),
  headers: {'Authorization': 'Bearer YOUR_MORX_API_KEY'},
);
print(jsonDecode(res.body)['data']['daily']);`
  },

  // ---------------------------------------------------------------------------
  // 4. MAPS: GEOCODING
  // ---------------------------------------------------------------------------
  {
    id: "maps-geocode",
    path: "/api/v1/maps/geocode",
    method: "GET",
    title: "Address & Landmark Geocoding",
    category: "maps",
    serviceName: "Maps & Geolocation",
    providers: ["Google Maps Platform", "Mapbox (Failover)"],
    cacheTtl: "24h Cache",
    rateLimit: "120 req/min",
    summary: "Converts text addresses and landmark names into high-precision GPS coordinates.",
    detailsText: "Translates human-readable names (e.g. 'Citadel of Qaitbay', 'Bibliotheca Alexandrina', 'Eiffel Tower') into latitude and longitude coordinates with formatted addresses and bounding boxes. Caches lookups for 24 hours.",
    params: [
      { name: "address", type: "string", required: true, desc: "Landmark, address, or tourist attraction name.", example: "Bibliotheca Alexandrina" }
    ],
    responseExplanation: "Returns normalized location metadata: `formatted_address`, `latitude`, `longitude`, `place_id`, and `types`.",
    responseSample: {
      success: true,
      service: "maps",
      data: {
        formatted_address: "Al Azaritah WA Ash Shatebi, Bab Sharqi, Alexandria Governorate, Egypt",
        latitude: 31.2089,
        longitude: 29.9092,
        place_id: "ChIJ7T1s338S9RQRv4o2d8Z37wU",
        types: ["library", "point_of_interest", "establishment"]
      },
      meta: { provider: "google_maps", cached: true, latency_ms: 8, timestamp: "2026-11-19T12:00:00Z" },
      errors: []
    },
    curlSnippet: `curl -X GET "https://morx-team.vercel.app/api/v1/maps/geocode?address=Bibliotheca+Alexandrina" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsSnippet: `const res = await fetch("https://morx-team.vercel.app/api/v1/maps/geocode?address=Bibliotheca+Alexandrina", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(\`Lat: \${data.latitude}, Lon: \${data.longitude}\`);`,
    pythonSnippet: `res = requests.get(
    "https://morx-team.vercel.app/api/v1/maps/geocode",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"},
    params={"address": "Bibliotheca Alexandrina"}
)
print(res.json()["data"])`,
    dartSnippet: `final res = await http.get(
  Uri.parse('https://morx-team.vercel.app/api/v1/maps/geocode?address=Bibliotheca+Alexandrina'),
  headers: {'Authorization': 'Bearer YOUR_MORX_API_KEY'},
);
print(jsonDecode(res.body)['data']);`
  },

  // ---------------------------------------------------------------------------
  // 5. MAPS: PLACES SEARCH
  // ---------------------------------------------------------------------------
  {
    id: "maps-places",
    path: "/api/v1/maps/places",
    method: "GET",
    title: "Nearby Places & POI Search",
    category: "maps",
    serviceName: "Maps & Geolocation",
    providers: ["Google Places API", "Mapbox Places"],
    cacheTtl: "6h Cache",
    rateLimit: "120 req/min",
    summary: "Searches points of interest (cafes, restaurants, museums, hotels) around specific coordinates.",
    detailsText: "Essential for location-based discovery in VoyageMind. Given a center coordinate and query, returns sorted nearby attractions with ratings, pricing levels, addresses, and distances.",
    params: [
      { name: "query", type: "string", required: true, desc: "Search keyword (e.g. 'Seafood Restaurant', 'Cafe', 'Museum').", example: "Cafe" },
      { name: "lat", type: "number", required: true, desc: "Center point latitude.", example: "31.2001" },
      { name: "lon", type: "number", required: true, desc: "Center point longitude.", example: "29.9187" },
      { name: "radius", type: "number", required: false, defaultVal: "5000", desc: "Search radius in meters (max: 50000).", example: "3000" },
    ],
    responseExplanation: "Returns array of place items with `id`, `name`, `address`, `location: { lat, lon }`, `rating`, `user_ratings_total`, and `open_now`.",
    responseSample: {
      success: true,
      service: "maps",
      data: [
        {
          id: "place_9812",
          name: "Greek Club Restaurant & Cafe",
          address: "Qaitbay St, Al Anfoushi, Alexandria",
          location: { lat: 31.2132, lon: 29.8851 },
          rating: 4.6,
          user_ratings_total: 3120,
          open_now: true
        }
      ],
      meta: { provider: "google_maps", cached: false, latency_ms: 145, timestamp: "2026-11-19T12:00:00Z" },
      errors: []
    },
    curlSnippet: `curl -X GET "https://morx-team.vercel.app/api/v1/maps/places?query=Cafe&lat=31.2001&lon=29.9187&radius=3000" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsSnippet: `const res = await fetch("https://morx-team.vercel.app/api/v1/maps/places?query=Cafe&lat=31.2001&lon=29.9187", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(data);`,
    pythonSnippet: `res = requests.get(
    "https://morx-team.vercel.app/api/v1/maps/places",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"},
    params={"query": "Cafe", "lat": 31.2001, "lon": 29.9187}
)
print(res.json()["data"])`,
    dartSnippet: `final res = await http.get(
  Uri.parse('https://morx-team.vercel.app/api/v1/maps/places?query=Cafe&lat=31.2001&lon=29.9187'),
  headers: {'Authorization': 'Bearer YOUR_MORX_API_KEY'},
);
print(jsonDecode(res.body)['data']);`
  },

  // ---------------------------------------------------------------------------
  // 6. MAPS: ISOCHRONE (REACHABILITY)
  // ---------------------------------------------------------------------------
  {
    id: "maps-isochrone",
    path: "/api/v1/maps/isochrone",
    method: "GET",
    title: "Isochrone Reachability Contours",
    category: "maps",
    serviceName: "Maps & Geolocation",
    providers: ["Mapbox Isochrone API"],
    cacheTtl: "24h Cache",
    rateLimit: "60 req/min",
    summary: "Calculates geographical reachability polygon areas reachable within specified travel times (e.g. 15, 30 mins).",
    detailsText: "Enables VoyageMind to visualize how far a traveler can walk or drive from their hotel in 15 or 30 minutes. Returns GeoJSON polygon contours that can be rendered directly on Mapbox, Leaflet, or Google Maps overlays.",
    params: [
      { name: "lat", type: "number", required: true, desc: "Origin latitude coordinate.", example: "31.2001" },
      { name: "lon", type: "number", required: true, desc: "Origin longitude coordinate.", example: "29.9187" },
      { name: "time", type: "number", required: false, defaultVal: "15", desc: "Travel time in minutes (e.g. 15, 30, 45, 60).", example: "15" },
      { name: "profile", type: "string", required: false, defaultVal: "walking", desc: "Routing profile: 'walking' | 'driving' | 'cycling'.", example: "walking" },
    ],
    responseExplanation: "Returns GeoJSON `FeatureCollection` polygon with coordinates boundary array.",
    responseSample: {
      success: true,
      service: "maps",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { contour: 15, metric: "time" },
            geometry: {
              type: "Polygon",
              coordinates: [[[29.91, 31.20], [29.92, 31.21], [29.90, 31.20]]]
            }
          }
        ]
      },
      meta: { provider: "mapbox", cached: true, latency_ms: 22, timestamp: "2026-11-19T12:00:00Z" },
      errors: []
    },
    curlSnippet: `curl -X GET "https://morx-team.vercel.app/api/v1/maps/isochrone?lat=31.2001&lon=29.9187&time=15&profile=walking" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsSnippet: `const res = await fetch("https://morx-team.vercel.app/api/v1/maps/isochrone?lat=31.2001&lon=29.9187&time=15", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(data.features[0].geometry);`,
    pythonSnippet: `res = requests.get(
    "https://morx-team.vercel.app/api/v1/maps/isochrone",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"},
    params={"lat": 31.2001, "lon": 29.9187, "time": 15}
)
print(res.json()["data"])`,
    dartSnippet: `final res = await http.get(
  Uri.parse('https://morx-team.vercel.app/api/v1/maps/isochrone?lat=31.2001&lon=29.9187&time=15'),
  headers: {'Authorization': 'Bearer YOUR_MORX_API_KEY'},
);
print(jsonDecode(res.body)['data']);`
  },

  // ---------------------------------------------------------------------------
  // 7. ROUTING: DIRECTIONS (OSRM & GOOGLE)
  // ---------------------------------------------------------------------------
  {
    id: "routes-directions",
    path: "/api/v1/routes/directions",
    method: "GET",
    title: "Turn-by-Turn Route Navigation & Geometry",
    category: "routing",
    serviceName: "Route Optimizer",
    providers: ["OSRM Route Engine", "Google Maps Platform"],
    cacheTtl: "1h Cache",
    rateLimit: "120 req/min",
    summary: "Computes driving or walking turn-by-turn directions, distances, durations, and decoded polyline coordinates.",
    detailsText: "Primary routing API for navigating between origin and destination. Supports OSRM engine (`osrmroute`) and Google Maps. Coordinates are returned as resolved float pairs `[lat, lon]` and complete GeoJSON `geometry.coordinates` array for map drawing.",
    params: [
      { name: "origin", type: "string", required: true, desc: "Starting point: 'lat,lon' coordinates or landmark name.", example: "31.2001,29.9187" },
      { name: "destination", type: "string", required: true, desc: "End point: 'lat,lon' coordinates or landmark name.", example: "31.2139,29.8856" },
      { name: "mode", type: "string", required: false, defaultVal: "driving", desc: "Travel mode: 'driving' | 'walking'.", example: "driving" },
      { name: "provider", type: "string", required: false, defaultVal: "osrmroute", desc: "Preferred routing engine: 'osrmroute' | 'google_maps'.", example: "osrmroute" },
    ],
    responseExplanation: "Returns `distance_meters`, formatted `distance`, `duration_seconds`, formatted `duration`, step-by-step navigation instructions, and full `geometry.coordinates` coordinate array.",
    responseSample: {
      success: true,
      service: "routing",
      data: {
        summary: "Corniche Road",
        origin: { latitude: 31.2001, longitude: 29.9187, name: "Bibliotheca Alexandrina" },
        destination: { latitude: 31.2139, longitude: 29.8856, name: "Citadel of Qaitbay" },
        distance_meters: 4501,
        distance_formatted: "4.5 km",
        duration_seconds: 299,
        duration_formatted: "5 mins",
        geometry: {
          type: "LineString",
          coordinates: [[29.9183, 31.1999], [29.9184, 31.1998], [29.8856, 31.2139]]
        }
      },
      meta: { provider: "osrmroute", cached: false, latency_ms: 82, timestamp: "2026-11-19T12:00:00Z" },
      errors: []
    },
    curlSnippet: `curl -X GET "https://morx-team.vercel.app/api/v1/routes/directions?origin=31.2001,29.9187&destination=31.2139,29.8856&mode=driving" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsSnippet: `const res = await fetch("https://morx-team.vercel.app/api/v1/routes/directions?origin=31.2001,29.9187&destination=31.2139,29.8856", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(\`Distance: \${data.distance_formatted}, Duration: \${data.duration_formatted}\`);`,
    pythonSnippet: `res = requests.get(
    "https://morx-team.vercel.app/api/v1/routes/directions",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"},
    params={"origin": "31.2001,29.9187", "destination": "31.2139,29.8856"}
)
print(res.json()["data"])`,
    dartSnippet: `final res = await http.get(
  Uri.parse('https://morx-team.vercel.app/api/v1/routes/directions?origin=31.2001,29.9187&destination=31.2139,29.8856'),
  headers: {'Authorization': 'Bearer YOUR_MORX_API_KEY'},
);
print(jsonDecode(res.body)['data']);`
  },

  // ---------------------------------------------------------------------------
  // 8. ROUTING: 2-OPT TSP TOUR OPTIMIZER
  // ---------------------------------------------------------------------------
  {
    id: "routes-optimize",
    path: "/api/v1/routes/optimize",
    method: "POST",
    title: "Multi-Stop Itinerary Tour Optimizer (TSP)",
    category: "routing",
    serviceName: "Route Optimizer",
    providers: ["Internal 2-Opt TSP Solver", "Google Routes Optimizer"],
    cacheTtl: "30m Cache",
    rateLimit: "60 req/min",
    summary: "Re-orders arbitrary lists of multi-stop attractions into the shortest, optimal touring path.",
    detailsText: "The cornerstone of VoyageMind's AI trip planning. Uses the 2-Opt Traveling Salesperson Problem (TSP) algorithm to eliminate route crossing and backtracking. Give it a start location, an arbitrary list of tourist stops, and destination; it returns the mathematically optimal visit order, saving 30%+ of travel time.",
    params: [],
    bodySchema: `{
  "origin": { "lat": 31.2001, "lon": 29.9187, "name": "Hotel / Starting Point" },
  "stops": [
    { "id": "stop_1", "lat": 31.2139, "lon": 29.8856, "name": "Citadel of Qaitbay" },
    { "id": "stop_2", "lat": 31.2843, "lon": 30.0163, "name": "Montaza Palace" },
    { "id": "stop_3", "lat": 31.1871, "lon": 29.8965, "name": "Pompey's Pillar" }
  ],
  "destination": { "lat": 31.2001, "lon": 29.9187, "name": "Return Hotel" }
}`,
    responseExplanation: "Returns `ordered_stops` in the optimized visit sequence, total `trip_distance_meters`, total `trip_duration_seconds`, and percentage of `distance_saved` compared to raw order.",
    responseSample: {
      success: true,
      service: "routing",
      data: {
        optimized_order: ["stop_3", "stop_1", "stop_2"],
        ordered_stops: [
          { id: "stop_3", name: "Pompey's Pillar", sequence_index: 1 },
          { id: "stop_1", name: "Citadel of Qaitbay", sequence_index: 2 },
          { id: "stop_2", name: "Montaza Palace", sequence_index: 3 }
        ],
        total_distance_km: 36.4,
        total_duration_minutes: 68,
        distance_saved_percent: 24.5
      },
      meta: { provider: "internal_tsp", cached: false, latency_ms: 110, timestamp: "2026-11-19T12:00:00Z" },
      errors: []
    },
    curlSnippet: `curl -X POST "https://morx-team.vercel.app/api/v1/routes/optimize" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "origin": { "lat": 31.2001, "lon": 29.9187 },
    "stops": [
      { "id": "stop_1", "lat": 31.2139, "lon": 29.8856 },
      { "id": "stop_2", "lat": 31.2843, "lon": 30.0163 }
    ],
    "destination": { "lat": 31.2001, "lon": 29.9187 }
  }'`,
    jsSnippet: `const res = await fetch("https://morx-team.vercel.app/api/v1/routes/optimize", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_MORX_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    origin: { lat: 31.2001, lon: 29.9187 },
    stops: [
      { id: "stop_1", lat: 31.2139, lon: 29.8856 },
      { id: "stop_2", lat: 31.2843, lon: 30.0163 }
    ],
    destination: { lat: 31.2001, lon: 29.9187 }
  })
});
const { data } = await res.json();
console.log(data.ordered_stops);`,
    pythonSnippet: `res = requests.post(
    "https://morx-team.vercel.app/api/v1/routes/optimize",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"},
    json={
        "origin": {"lat": 31.2001, "lon": 29.9187},
        "stops": [{"id": "s1", "lat": 31.2139, "lon": 29.8856}],
        "destination": {"lat": 31.2001, "lon": 29.9187}
    }
)
print(res.json()["data"])`,
    dartSnippet: `final res = await http.post(
  Uri.parse('https://morx-team.vercel.app/api/v1/routes/optimize'),
  headers: {
    'Authorization': 'Bearer YOUR_MORX_API_KEY',
    'Content-Type': 'application/json',
  },
  body: jsonEncode({
    'origin': {'lat': 31.2001, 'lon': 29.9187},
    'stops': [{'id': 's1', 'lat': 31.2139, 'lon': 29.8856}],
    'destination': {'lat': 31.2001, 'lon': 29.9187}
  }),
);
print(jsonDecode(res.body)['data']);`
  },

  // ---------------------------------------------------------------------------
  // 9. FINANCE: CURRENCY EXCHANGE
  // ---------------------------------------------------------------------------
  {
    id: "finance-exchange",
    path: "/api/v1/finance/exchange",
    method: "GET",
    title: "Real-Time Currency Exchange & Rates",
    category: "finance",
    serviceName: "Financial Rates",
    providers: ["European Central Bank (Frankfurter)"],
    cacheTtl: "1h Cache",
    rateLimit: "120 req/min",
    summary: "Converts real-time currency exchange rates published by the European Central Bank (ECB).",
    detailsText: "Essential for international travelers in VoyageMind to convert trip costs, hotel bookings, food expenses, and admission tickets between their home currency (USD, EUR, GBP, SAR, etc.) and destination currency (EGP, etc.). Automatically checks ECB reference data.",
    params: [
      { name: "from", type: "string", required: false, defaultVal: "USD", desc: "Base source currency 3-letter ISO code.", example: "USD" },
      { name: "to", type: "string", required: false, defaultVal: "EUR", desc: "Target currency 3-letter ISO code.", example: "EUR" },
      { name: "amount", type: "number", required: false, defaultVal: "1", desc: "Monetary amount to convert.", example: "100" },
    ],
    responseExplanation: "Returns `base`, `amount`, `converted_amount`, `rate`, and `date` of reference rate.",
    responseSample: {
      success: true,
      service: "finance",
      data: {
        base: "USD",
        target: "EUR",
        amount: 100,
        rate: 0.925,
        converted_amount: 92.5,
        date: "2026-11-19",
        source: "European Central Bank (Frankfurter)"
      },
      meta: { provider: "frankfurter", cached: true, latency_ms: 15, timestamp: "2026-11-19T12:00:00Z" },
      errors: []
    },
    curlSnippet: `curl -X GET "https://morx-team.vercel.app/api/v1/finance/exchange?from=USD&to=EUR&amount=100" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsSnippet: `const res = await fetch("https://morx-team.vercel.app/api/v1/finance/exchange?from=USD&to=EUR&amount=100", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(\`100 USD = \${data.converted_amount} EUR\`);`,
    pythonSnippet: `res = requests.get(
    "https://morx-team.vercel.app/api/v1/finance/exchange",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"},
    params={"from": "USD", "to": "EUR", "amount": 100}
)
print(res.json()["data"])`,
    dartSnippet: `final res = await http.get(
  Uri.parse('https://morx-team.vercel.app/api/v1/finance/exchange?from=USD&to=EUR&amount=100'),
  headers: {'Authorization': 'Bearer YOUR_MORX_API_KEY'},
);
print(jsonDecode(res.body)['data']);`
  },

  // ---------------------------------------------------------------------------
  // 10. NEWS: MEDIA SEARCH
  // ---------------------------------------------------------------------------
  {
    id: "news-search",
    path: "/api/v1/news/search",
    method: "GET",
    title: "Global & Destination News Headlines",
    category: "news",
    serviceName: "News & Media",
    providers: ["GNews API"],
    cacheTtl: "30m Cache",
    rateLimit: "60 req/min",
    summary: "Searches verified world and regional news publications, travel alerts, and headlines.",
    detailsText: "Supplies VoyageMind travelers with live destination advisories, local event news, cultural festivals, and airport transit updates. Enriched with publisher names, article URLs, and teaser imagery.",
    params: [
      { name: "q", type: "string", required: true, desc: "Search topic or destination keyword.", example: "Egypt Tourism" },
      { name: "lang", type: "string", required: false, defaultVal: "en", desc: "Language code: 'en' | 'ar' | 'fr' | 'de' | 'es'.", example: "en" },
      { name: "limit", type: "number", required: false, defaultVal: "10", desc: "Articles to return (max: 20).", example: "5" },
    ],
    responseExplanation: "Returns `data` array with `title`, `description`, `content`, `url`, `image`, `publishedAt`, and `source: { name, url }`.",
    responseSample: {
      success: true,
      service: "news",
      data: [
        {
          title: "Alexandria Celebrates Mediterranean Cultural Festival",
          description: "International travelers flock to Alexandria for coastal heritage week.",
          url: "https://news.example.com/alexandria-festival",
          image: "https://images.example.com/alexandria.jpg",
          publishedAt: "2026-11-19T08:00:00Z",
          source: { name: "Egypt Independent", url: "https://egyptindependent.com" }
        }
      ],
      meta: { provider: "gnews", cached: false, latency_ms: 140, timestamp: "2026-11-19T12:00:00Z" },
      errors: []
    },
    curlSnippet: `curl -X GET "https://morx-team.vercel.app/api/v1/news/search?q=Egypt+Tourism&lang=en&limit=5" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsSnippet: `const res = await fetch("https://morx-team.vercel.app/api/v1/news/search?q=Egypt+Tourism", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(data);`,
    pythonSnippet: `res = requests.get(
    "https://morx-team.vercel.app/api/v1/news/search",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"},
    params={"q": "Egypt Tourism"}
)
print(res.json()["data"])`,
    dartSnippet: `final res = await http.get(
  Uri.parse('https://morx-team.vercel.app/api/v1/news/search?q=Egypt+Tourism'),
  headers: {'Authorization': 'Bearer YOUR_MORX_API_KEY'},
);
print(jsonDecode(res.body)['data']);`
  },

  // ---------------------------------------------------------------------------
  // 11. UTILS: IP GEOLOCATION
  // ---------------------------------------------------------------------------
  {
    id: "utils-ip-lookup",
    path: "/api/v1/utils/ip-lookup",
    method: "GET",
    title: "IP Geolocation & Network Resolver",
    category: "utils",
    serviceName: "Network Utils",
    providers: ["IP-API Geolocation"],
    cacheTtl: "24h Cache",
    rateLimit: "120 req/min",
    summary: "Resolves client IP addresses into approximate cities, country codes, timezones, and coordinates.",
    detailsText: "Enables VoyageMind to detect a new traveler's country and city automatically upon opening the app without immediately requiring GPS permissions. When `ip` parameter is omitted, it automatically inspects the incoming client request IP.",
    params: [
      { name: "ip", type: "string", required: false, desc: "IPv4 or IPv6 address. Defaults to caller's IP.", example: "8.8.8.8" }
    ],
    responseExplanation: "Returns `ip`, `city`, `region`, `country`, `country_code`, `lat`, `lon`, `timezone`, and `isp`.",
    responseSample: {
      success: true,
      service: "utils",
      data: {
        ip: "8.8.8.8",
        city: "Mountain View",
        region: "California",
        country: "United States",
        country_code: "US",
        lat: 37.4223,
        lon: -122.0848,
        timezone: "America/Los_Angeles",
        isp: "Google LLC"
      },
      meta: { provider: "ip_geolocation", cached: true, latency_ms: 10, timestamp: "2026-11-19T12:00:00Z" },
      errors: []
    },
    curlSnippet: `curl -X GET "https://morx-team.vercel.app/api/v1/utils/ip-lookup?ip=8.8.8.8" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsSnippet: `const res = await fetch("https://morx-team.vercel.app/api/v1/utils/ip-lookup", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(\`Visitor City: \${data.city}, \${data.country}\`);`,
    pythonSnippet: `res = requests.get(
    "https://morx-team.vercel.app/api/v1/utils/ip-lookup",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"}
)
print(res.json()["data"])`,
    dartSnippet: `final res = await http.get(
  Uri.parse('https://morx-team.vercel.app/api/v1/utils/ip-lookup'),
  headers: {'Authorization': 'Bearer YOUR_MORX_API_KEY'},
);
print(jsonDecode(res.body)['data']);`
  },

  // ---------------------------------------------------------------------------
  // 12. SOCIAL: TIKTOK
  // ---------------------------------------------------------------------------
  {
    id: "social-tiktok",
    path: "/api/v1/tiktok/videos",
    method: "GET",
    title: "TikTok Creator Videos & Engagement",
    category: "social",
    serviceName: "Social Feeds",
    providers: ["TikTok Display API"],
    cacheTtl: "15m Cache",
    rateLimit: "60 req/min",
    summary: "Retrieves public video reels, captions, and engagement metrics for authorized creator accounts.",
    detailsText: "Allows travel creators to show live video portfolios and reels inside VoyageMind itineraries.",
    params: [
      { name: "max_count", type: "number", required: false, defaultVal: "20", desc: "Max items to return (1-50).", example: "10" },
      { name: "cursor", type: "string", required: false, desc: "Pagination cursor for batch navigation.", example: "172819200" }
    ],
    responseExplanation: "Returns video array with `id`, `title`, `cover_image_url`, `like_count`, `comment_count`, and `share_count`.",
    responseSample: {
      success: true,
      service: "social",
      data: [
        {
          id: "712839210",
          title: "Hidden Gems in Egypt You Must Visit!",
          cover_image_url: "https://p16.tiktokcdn.com/cover.jpg",
          like_count: 89400,
          comment_count: 1420
        }
      ],
      meta: { provider: "tiktok", cached: false, latency_ms: 120, timestamp: "2026-11-19T12:00:00Z" },
      errors: []
    },
    curlSnippet: `curl -X GET "https://morx-team.vercel.app/api/v1/tiktok/videos?max_count=10" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsSnippet: `const res = await fetch("https://morx-team.vercel.app/api/v1/tiktok/videos?max_count=10", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
console.log(await res.json());`,
    pythonSnippet: `res = requests.get(
    "https://morx-team.vercel.app/api/v1/tiktok/videos",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"}
)
print(res.json()["data"])`,
    dartSnippet: `final res = await http.get(
  Uri.parse('https://morx-team.vercel.app/api/v1/tiktok/videos'),
  headers: {'Authorization': 'Bearer YOUR_MORX_API_KEY'},
);
print(jsonDecode(res.body)['data']);`
  },

  // ---------------------------------------------------------------------------
  // 13. SOCIAL: INSTAGRAM REELS (APIFY + RAPIDAPI MULTI-PROVIDER FALLBACK)
  // ---------------------------------------------------------------------------
  {
    id: "social-instagram-reels",
    path: "/api/instagram/reels/search",
    method: "GET",
    title: "Instagram Reels Hashtag Search (Apify + RapidAPI Fallback)",
    category: "social",
    serviceName: "Instagram Platform",
    providers: ["Apify", "RapidAPI"],
    cacheTtl: "10m Cache",
    rateLimit: "60 req/min",
    summary: "Searches public Instagram Reels by hashtag without Meta Graph API restrictions using an automatic Apify-to-RapidAPI fallback strategy.",
    detailsText: "Essential for VoyageMind travel feeds. Scrapes public Reels tagged with any destination hashtag (e.g. travel, alexandria, cairo), returning high-resolution video streams, thumbnails, view/like metrics, audio info, and creator handles.",
    params: [
      { name: "tag", type: "string", required: true, desc: "Hashtag keyword without '#'. Leading hashes are stripped automatically.", example: "travel" },
      { name: "limit", type: "number", required: false, defaultVal: "10", desc: "Number of Reels to return (1-30).", example: "10" },
      { name: "sort", type: "string", required: false, defaultVal: "top", desc: "Sorting order: 'top' (highest likes/views) or 'recent' (chronological).", example: "top" }
    ],
    responseExplanation: "Returns normalized Reels array with shortcode, video_url, thumbnail, views_count, like_count, comments_count, and creator owner metadata.",
    responseSample: {
      success: true,
      service: "instagram",
      data: [
        {
          id: "3985123576472766346",
          shortcode: "DdOAMdZsYeK",
          caption: "Bucket list destination: The Great Pyramids of Giza! #travel #cairo #egypt",
          video_url: "https://scontent.cdninstagram.com/v/t50.2886-16/reel_video.mp4",
          permalink: "https://www.instagram.com/reel/DdOAMdZsYeK/",
          thumbnail: "https://scontent.cdninstagram.com/v/t51.2885-15/thumb.jpg",
          published_at: "2026-11-20T14:30:00.000Z",
          duration: 18.5,
          like_count: 24500,
          comments_count: 380,
          views_count: 142000,
          owner: {
            username: "voyage_explorer",
            full_name: "World Explorer",
            profile_pic_url: "https://scontent.cdninstagram.com/profile.jpg"
          },
          hashtags: ["travel", "cairo", "egypt"]
        }
      ],
      meta: {
        provider: "apify",
        providers_used: ["apify"],
        cached: false,
        latency_ms: 1850,
        total_returned: 1,
        request_id: "req_ig_90812",
        timestamp: "2026-11-20T22:00:00Z"
      },
      errors: []
    },
    curlSnippet: `curl -X GET "https://morx-team.vercel.app/api/instagram/reels/search?tag=travel&limit=10&sort=top" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsSnippet: `const res = await fetch("https://morx-team.vercel.app/api/instagram/reels/search?tag=travel&limit=10", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const data = await res.json();
console.log(data.data);`,
    pythonSnippet: `import requests

res = requests.get(
    "https://morx-team.vercel.app/api/instagram/reels/search",
    params={"tag": "travel", "limit": 10, "sort": "top"},
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"}
)
print(res.json()["data"])`,
    dartSnippet: `final res = await http.get(
  Uri.parse('https://morx-team.vercel.app/api/instagram/reels/search?tag=travel&limit=10'),
  headers: {'Authorization': 'Bearer YOUR_MORX_API_KEY'},
);
final reels = jsonDecode(res.body)['data'];
print(reels);`
  },

  // ---------------------------------------------------------------------------
  // 14. SYSTEM: HEALTH
  // ---------------------------------------------------------------------------
  {
    id: "system-health",
    path: "/api/v1/gateway/health",
    method: "GET",
    title: "Live Provider Health & Circuit Breaker Status",
    category: "system",
    serviceName: "Gateway System",
    providers: ["Morx Health Checker"],
    cacheTtl: "Realtime",
    rateLimit: "300 req/min",
    summary: "Monitors upstream provider latencies, availability, and circuit breaker trip states.",
    detailsText: "Returns live diagnostic health metrics for all 13 third-party providers. Can be polled by monitoring daemons or status widgets.",
    params: [],
    responseExplanation: "Returns dictionary of registered providers with `status` ('healthy', 'degraded', 'unhealthy') and `latency_ms`.",
    responseSample: {
      success: true,
      service: "gateway",
      data: {
        status: "healthy",
        healthy_providers: 13,
        total_providers: 13,
        providers: {
          youtube: { status: "healthy", latency_ms: 85 },
          open_meteo: { status: "healthy", latency_ms: 62 },
          osrmroute: { status: "healthy", latency_ms: 78 },
          frankfurter: { status: "healthy", latency_ms: 24 }
        }
      },
      meta: { provider: "morx_core", cached: false, latency_ms: 5, timestamp: "2026-11-19T12:00:00Z" },
      errors: []
    },
    curlSnippet: `curl -X GET "https://morx-team.vercel.app/api/v1/gateway/health" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsSnippet: `const res = await fetch("https://morx-team.vercel.app/api/v1/gateway/health", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
console.log(await res.json());`,
    pythonSnippet: `res = requests.get(
    "https://morx-team.vercel.app/api/v1/gateway/health",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"}
)
print(res.json()["data"])`,
    dartSnippet: `final res = await http.get(
  Uri.parse('https://morx-team.vercel.app/api/v1/gateway/health'),
  headers: {'Authorization': 'Bearer YOUR_MORX_API_KEY'},
);
print(jsonDecode(res.body)['data']);`
  }
];

const CATEGORIES = [
  { id: "all", label: "All Endpoints", icon: Layers },
  { id: "videos", label: "Videos", logo: YouTubeLogo },
  { id: "weather", label: "Weather", logo: OpenWeatherLogo },
  { id: "maps", label: "Maps & Places", logo: GoogleMapsLogo },
  { id: "routing", label: "Routes (OSRM/TSP)", logo: OSRMRouteLogo },
  { id: "finance", label: "Rates & Exchange", logo: FrankfurterLogo },
  { id: "news", label: "News & Media", logo: GNewsLogo },
  { id: "utils", label: "Network & IP", logo: IpGeolocationLogo },
  { id: "social", label: "Social Feeds", logo: TikTokLogo },
  { id: "system", label: "Gateway Health", icon: Activity },
];

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<"api" | "platform">("api")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeCodeLang, setActiveCodeLang] = useState<Record<string, "curl" | "js" | "python" | "dart">>({})
  const [customApiKey, setCustomApiKey] = useState("")

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filtered endpoints based on search and category
  const filteredEndpoints = useMemo(() => {
    return ENDPOINTS_DOCUMENTATION.filter((ep) => {
      const matchesCategory = selectedCategory === "all" || ep.category === selectedCategory
      const q = searchQuery.toLowerCase().trim()
      const matchesQuery = 
        !q ||
        ep.title.toLowerCase().includes(q) ||
        ep.path.toLowerCase().includes(q) ||
        ep.summary.toLowerCase().includes(q) ||
        ep.serviceName.toLowerCase().includes(q) ||
        ep.providers.some(p => p.toLowerCase().includes(q)) ||
        ep.params.some(p => p.name.toLowerCase().includes(q))
      return matchesCategory && matchesQuery
    })
  }, [searchQuery, selectedCategory])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        
        {/* ===================================================================== */}
        {/* TOP HERO & MODE SWITCHER */}
        {/* ===================================================================== */}
        <div className="space-y-6 mb-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold mb-3">
                <Sparkles className="size-3.5" /> Complete Developer Documentation & Connection Specs
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
                VoyageMind API Documentation
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-3xl leading-relaxed">
                Full text explanations, parameters, returned structures, and live code snippets for every endpoint in the Unified Morx API Gateway.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-2 self-start md:self-auto bg-muted/60 p-1.5 rounded-2xl border border-border/70">
              <button
                onClick={() => setActiveTab("api")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === "api"
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code2 className="size-3.5" />
                <span>API Gateway Reference</span>
              </button>
              <button
                onClick={() => setActiveTab("platform")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === "platform"
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="size-3.5" />
                <span>Workspace Guide</span>
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: API GATEWAY COMPREHENSIVE DOCUMENTATION */}
        {/* ===================================================================== */}
        {activeTab === "api" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ----------------------------------------------------------------- */}
            {/* LEFT SIDEBAR: QUICK NAVIGATION & SEARCH */}
            {/* ----------------------------------------------------------------- */}
            <aside className="lg:col-span-3 sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
              
              {/* Search Box */}
              <div className="relative">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter endpoints & params..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-border/70 bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              {/* Quick Connection Card */}
              <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-500 text-[11px] uppercase tracking-wider">
                  <ShieldCheck className="size-3.5" /> Quick Connection
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  All calls require your secret Morx API Key sent in the HTTP Authorization header:
                </p>
                <div className="p-2 rounded-lg bg-background border border-border/60 font-mono text-[10px] break-all flex items-center justify-between">
                  <span className="text-foreground">Authorization: Bearer <span className="text-primary font-bold">KEY</span></span>
                  <button 
                    onClick={() => handleCopy("Authorization: Bearer YOUR_MORX_API_KEY", "auth-hdr")}
                    className="p-1 hover:text-primary transition-colors text-muted-foreground"
                    title="Copy Header"
                  >
                    {copiedId === "auth-hdr" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  </button>
                </div>
                <Link
                  href="/gateway"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold pt-1"
                >
                  <span>Issue your API Key in Gateway</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>

              {/* Endpoints Table of Contents */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-2 block mb-1">
                  Endpoints List ({filteredEndpoints.length})
                </span>
                <nav className="space-y-1">
                  {filteredEndpoints.map((ep) => (
                    <a
                      key={ep.id}
                      href={`#${ep.id}`}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <span className="truncate max-w-[170px] font-medium group-hover:translate-x-0.5 transition-transform">
                        {ep.title}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        ep.method === "POST" ? "bg-amber-500/20 text-amber-500" : "bg-primary/20 text-primary"
                      }`}>
                        {ep.method}
                      </span>
                    </a>
                  ))}
                </nav>
              </div>

            </aside>

            {/* ----------------------------------------------------------------- */}
            {/* RIGHT MAIN CONTENT: DETAILED ENDPOINT SPECS */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-9 space-y-10">

              {/* SECTION: CONNECTION & AUTHENTICATION MASTER GUIDE */}
              <div className="p-6 md:p-8 rounded-3xl bg-card border border-border/80 space-y-6 shadow-xs">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    <Server className="size-4" /> Global Connection Specs
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Connecting to the Morx Unified Gateway
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Every endpoint in the Morx Gateway communicates over HTTPS using standardized JSON envelopes. Follow this simple handshake to connect from any frontend, mobile app, or backend service.
                  </p>
                </div>

                {/* Connection Matrix Grid */}
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono font-bold">1. Base URL</span>
                    <p className="font-mono text-foreground font-bold text-xs truncate">https://morx-team.vercel.app</p>
                    <p className="text-[10px] text-muted-foreground">Always use HTTPS production host</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono font-bold">2. Auth Header</span>
                    <p className="font-mono text-foreground font-bold text-xs truncate">Authorization: Bearer &lt;KEY&gt;</p>
                    <p className="text-[10px] text-muted-foreground">Generated via /gateway dashboard</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono font-bold">3. Normalized Envelope</span>
                    <p className="font-mono text-emerald-500 font-bold text-xs">success, service, data, meta</p>
                    <p className="text-[10px] text-muted-foreground">Guaranteed schema across all APIs</p>
                  </div>
                </div>

                {/* Response Envelope Explanation */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-2 text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <FileJson className="size-3.5 text-primary" /> The Standardized JSON Envelope Format
                  </span>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Unlike raw third-party APIs that return inconsistent, deeply-nested responses, Morx wraps every successful call or error into a unified structure:
                  </p>
                  <pre className="p-3 rounded-xl bg-background border border-border/70 font-mono text-[11px] text-muted-foreground overflow-x-auto leading-relaxed">
{`{
  "success": true,               // Boolean: overall operation success
  "service": "weather",          // Target namespace (weather, maps, routing, videos, finance, news, utils)
  "data": { ... },               // Standardized payload regardless of upstream provider
  "meta": {                      // Telemetry: provider used, cache flag, latency in ms
    "provider": "open_meteo",
    "cached": false,
    "latency_ms": 65,
    "timestamp": "2026-11-19T12:00:00Z"
  },
  "errors": []                   // Array of errors if success is false
}`}
                  </pre>
                </div>
              </div>

              {/* CATEGORY FILTER PILLS */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-3">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? "bg-foreground text-background font-bold shadow-xs"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat.logo ? (
                        <cat.logo className="size-3.5 shrink-0" />
                      ) : cat.icon ? (
                        <cat.icon className="size-3.5 shrink-0" />
                      ) : null}
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* --------------------------------------------------------------- */}
              {/* ENDPOINT CARDS */}
              {/* --------------------------------------------------------------- */}
              <div className="space-y-12">
                {filteredEndpoints.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground space-y-2 border border-dashed rounded-3xl">
                    <Search className="size-8 mx-auto text-muted-foreground/40" />
                    <p className="font-bold text-foreground">No matching endpoints found</p>
                    <p className="text-xs">Try searching for other keywords or clear the category filter.</p>
                  </div>
                ) : (
                  filteredEndpoints.map((ep, idx) => {
                    const currentLang = activeCodeLang[ep.id] || "curl"
                    const currentSnippet = 
                      currentLang === "curl" ? ep.curlSnippet :
                      currentLang === "js" ? ep.jsSnippet :
                      currentLang === "python" ? ep.pythonSnippet : ep.dartSnippet

                    return (
                      <article
                        key={ep.id}
                        id={ep.id}
                        className="p-6 md:p-8 rounded-3xl bg-card border border-border/80 space-y-6 shadow-xs scroll-mt-24 transition-all hover:border-primary/40"
                      >
                        {/* Header: Title, Method, Path, Badges */}
                        <div className="space-y-2 border-b border-border/50 pb-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <ProviderBrandLogo name={ep.category} className="size-5 shrink-0 shadow-xs" />
                              <h3 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
                                {ep.title}
                              </h3>
                            </div>
                            
                            <div className="flex items-center gap-2 font-mono text-[10px]">
                              <span className="px-2 py-0.5 rounded-full bg-muted border text-muted-foreground">
                                {ep.cacheTtl}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-muted border text-muted-foreground">
                                {ep.rateLimit}
                              </span>
                            </div>
                          </div>

                          {/* HTTP Path pill */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                            <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                              ep.method === "POST" 
                                ? "bg-amber-500/15 text-amber-500 border border-amber-500/30" 
                                : "bg-primary/15 text-primary border border-primary/30"
                            }`}>
                              {ep.method}
                            </span>
                            <code className="px-3 py-1 rounded-lg bg-muted/60 border border-border/70 text-foreground font-bold">
                              {ep.path}
                            </code>
                            <div className="flex items-center gap-1.5 ml-auto text-muted-foreground text-[11px]">
                              <span>Upstream:</span>
                              <span className="text-foreground font-medium">{ep.providers.join(", ")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Text Explanation & Use Cases */}
                        <div className="space-y-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block font-mono">
                            Endpoint Overview & Details
                          </span>
                          <p className="text-xs md:text-sm text-foreground/90 leading-relaxed">
                            {ep.detailsText}
                          </p>
                        </div>

                        {/* Parameters Table */}
                        {ep.params.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block font-mono">
                              Request Query Parameters
                            </span>
                            <div className="border border-border/70 rounded-2xl overflow-hidden bg-background">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-muted/40 border-b border-border/70 text-[10px] text-muted-foreground uppercase font-mono">
                                  <tr>
                                    <th className="p-3">Parameter</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Requirement</th>
                                    <th className="p-3">Default</th>
                                    <th className="p-3">Description & Example</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50 text-xs">
                                  {ep.params.map((param) => (
                                    <tr key={param.name} className="hover:bg-muted/20 transition-colors">
                                      <td className="p-3 font-mono font-bold text-foreground">{param.name}</td>
                                      <td className="p-3 font-mono text-muted-foreground text-[11px]">{param.type}</td>
                                      <td className="p-3">
                                        {param.required ? (
                                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                            Required
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-muted text-muted-foreground border">
                                            Optional
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3 font-mono text-muted-foreground text-[11px]">{param.defaultVal || "—"}</td>
                                      <td className="p-3 text-muted-foreground leading-normal">
                                        {param.desc}
                                        {param.example && (
                                          <code className="ml-1.5 px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] text-foreground">
                                            eg: {param.example}
                                          </code>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Request Body Schema (If POST) */}
                        {ep.bodySchema && (
                          <div className="space-y-2">
                            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block font-mono">
                              Request JSON Body Schema
                            </span>
                            <div className="relative">
                              <pre className="p-4 rounded-2xl bg-muted/30 border border-border/70 font-mono text-xs text-foreground overflow-x-auto leading-relaxed">
                                {ep.bodySchema}
                              </pre>
                              <button
                                onClick={() => handleCopy(ep.bodySchema!, `${ep.id}-body`)}
                                className="absolute right-3 top-3 p-1.5 rounded-lg bg-background border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1 font-mono transition-colors"
                              >
                                {copiedId === `${ep.id}-body` ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                                <span>{copiedId === `${ep.id}-body` ? "Copied" : "Copy Body"}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Response Explanation & Sample */}
                        <div className="space-y-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block font-mono">
                            Response Format & Structure
                          </span>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {ep.responseExplanation}
                          </p>

                          {/* JSON Response Block */}
                          <div className="relative">
                            <pre className="p-4 rounded-2xl bg-background border border-border/70 font-mono text-xs text-muted-foreground overflow-x-auto max-h-72 leading-relaxed">
                              {JSON.stringify(ep.responseSample, null, 2)}
                            </pre>
                            <button
                              onClick={() => handleCopy(JSON.stringify(ep.responseSample, null, 2), `${ep.id}-resp`)}
                              className="absolute right-3 top-3 p-1.5 rounded-lg bg-card border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1 font-mono transition-colors"
                            >
                              {copiedId === `${ep.id}-resp` ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                              <span>{copiedId === `${ep.id}-resp` ? "Copied" : "Copy JSON"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Ready-to-use Code Integration Tabs */}
                        <div className="space-y-2 pt-2 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block font-mono flex items-center gap-1.5">
                              <Code2 className="size-3.5 text-primary" /> Connection Snippet
                            </span>

                            {/* Language Pills */}
                            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl font-mono text-[10px]">
                              {(["curl", "js", "python", "dart"] as const).map((lang) => (
                                <button
                                  key={lang}
                                  onClick={() => setActiveCodeLang((prev) => ({ ...prev, [ep.id]: lang }))}
                                  className={`px-2.5 py-1 rounded-lg uppercase font-bold transition-all ${
                                    currentLang === lang
                                      ? "bg-foreground text-background shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {lang}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="relative">
                            <pre className="p-4 rounded-2xl bg-muted/30 border border-border/70 font-mono text-xs text-foreground overflow-x-auto leading-relaxed">
                              {currentSnippet}
                            </pre>
                            <button
                              onClick={() => handleCopy(currentSnippet, `${ep.id}-code`)}
                              className="absolute right-3 top-3 p-1.5 rounded-lg bg-background border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1 font-mono transition-colors"
                            >
                              {copiedId === `${ep.id}-code` ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                              <span>{copiedId === `${ep.id}-code` ? "Copied" : "Copy Code"}</span>
                            </button>
                          </div>
                        </div>

                      </article>
                    )
                  })
                )}
              </div>

            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: MORX WORKSPACE GUIDE (TASK & TEAM MANAGEMENT) */}
        {/* ===================================================================== */}
        {activeTab === "platform" && (
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-6 shadow-xs max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold">Morx Workspace & Collaboration Guide</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Morx provides teams with rich tools for project tracking, automated workflows, and task collaboration.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-muted/30 border space-y-2">
                <span className="font-bold text-foreground text-sm">Teams & Workspaces</span>
                <p className="text-muted-foreground">Create public and private teams, invite collaborators, and manage role-based permissions.</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/30 border space-y-2">
                <span className="font-bold text-foreground text-sm">Kanban & Task Management</span>
                <p className="text-muted-foreground">Assign tasks, move items through custom sprint columns, and attach documents.</p>
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  )
}
