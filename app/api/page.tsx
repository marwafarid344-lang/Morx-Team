"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Terminal, 
  Key, 
  Globe, 
  Cpu, 
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  Video,
  CloudSun,
  Compass,
  Navigation,
  Share2,
  Clock,
  Zap,
  ExternalLink,
  Search,
  Sparkles,
  Layers,
  FlaskConical,
  Database,
  ChevronDown,
  Code2,
  SlidersHorizontal,
  Info,
  X
} from "lucide-react"
import Link from "next/link"
import { GatewayDocsView } from "@/components/gateway/gateway-docs-view"
import { 
  BookOpen, 
  Shield, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Gauge, 
  FileJson, 
  Workflow, 
  RefreshCw, 
  Play, 
  Lightbulb 
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ApiAccessGuard } from "@/components/gateway/api-access-guard"

interface Parameter {
  name: string
  type: string
  required: boolean
  defaultVal?: string
  description: string
}

interface Endpoint {
  path: string
  method: "GET" | "POST"
  title: string
  desc: string
  category: string
  providers: string[]
  cacheTtl: string
  rateLimit: string
  params: Parameter[]
  requestExample?: string
  responseExample: string
  curlExample: string
  jsExample: string
  pythonExample: string
  importantNotes?: string[]
}

const CATEGORIES = [
  { id: "all", label: "All Services", icon: Layers },
  { id: "videos", label: "Video Discovery", icon: Video },
  { id: "weather", label: "Weather", icon: CloudSun },
  { id: "maps", label: "Maps & Places", icon: Compass },
  { id: "routing", label: "Route Optimizer", icon: Navigation },
  { id: "finance", label: "Financial Rates", icon: Zap },
  { id: "news", label: "News & Media", icon: BookOpen },
  { id: "utils", label: "Network Utils", icon: Globe },
  { id: "social", label: "Social Feeds", icon: Share2 },
  { id: "maintenance", label: "Database Cron", icon: Database },
]

const ENDPOINTS: Endpoint[] = [
  {
    path: "/api/v1/videos/search",
    method: "GET",
    title: "Video Search & Metadata",
    desc: "Search YouTube & video providers with unified metadata, view counts, creator details, and duration filters.",
    category: "videos",
    providers: ["YouTube Data API v3"],
    cacheTtl: "10m Cache",
    rateLimit: "120 req/min",
    params: [
      { name: "q", type: "string", required: true, description: "Search query keyword (e.g. 'Alexandria Egypt')." },
      { name: "limit", type: "number", required: false, defaultVal: "20", description: "Number of videos to return (max: 50)." },
      { name: "page", type: "string", required: false, description: "Next page token for pagination." },
      { name: "sort", type: "string", required: false, defaultVal: "relevance", description: "'relevance' | 'date' | 'rating' | 'viewCount'" },
      { name: "duration", type: "string", required: false, defaultVal: "any", description: "'any' | 'short' (<4m) | 'medium' (4-20m) | 'long' (>20m)" },
    ],
    importantNotes: [
      "Quotas: YouTube search consumes 100 quota units per call. Caching identical searches for 10 minutes saves 90%+ of quota.",
      "Video Statistics: View counts and likes are enriched automatically in background batches.",
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/v1/videos/search?q=Alexandria&limit=5" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/videos/search?q=Alexandria&limit=5", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(data); // UnifiedVideo[]`,
    pythonExample: `import requests
res = requests.get(
    "https://YOUR-DOMAIN/api/v1/videos/search",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"},
    params={"q": "Alexandria", "limit": 5}
)
print(res.json()["data"])`,
    responseExample: `{
  "success": true,
  "service": "videos",
  "data": [
    {
      "id": "e_abc123",
      "provider": "youtube",
      "title": "Alexandria — Mediterranean Pearl",
      "thumbnail": "https://i.ytimg.com/vi/e_abc123/hqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=e_abc123",
      "creator": { "name": "Egypt Tours" },
      "duration_seconds": 645,
      "statistics": { "views": 24500, "likes": 1280 }
    }
  ],
  "meta": { "provider": "youtube", "cached": false, "latency_ms": 138 }
}`
  },
  {
    path: "/api/v1/weather/current",
    method: "GET",
    title: "Current Weather Conditions",
    desc: "Real-time temperature, humidity, wind, pressure, and weather conditions by city name or coordinates.",
    category: "weather",
    providers: ["OpenWeather API", "Open-Meteo API (Failover & Direct)"],
    cacheTtl: "5m Cache",
    rateLimit: "120 req/min",
    params: [
      { name: "city", type: "string", required: false, description: "City name (e.g. 'Alexandria' or 'Cairo')." },
      { name: "lat", type: "number", required: false, description: "Latitude coordinate." },
      { name: "lon", type: "number", required: false, description: "Longitude coordinate." },
      { name: "provider", type: "string", required: false, defaultVal: "auto", description: "'openweather' | 'open_meteo' (auto-failover by default)" },
      { name: "unit", type: "string", required: false, defaultVal: "celsius", description: "'celsius' | 'fahrenheit' | 'kelvin'" },
    ],
    importantNotes: [
      "Multi-Provider Weather Routing: Pass ?provider=open_meteo or ?provider=openweather to select a specific provider.",
      "Zero-Failure Resilience: If OpenWeather is unavailable, the gateway automatically falls back to Open-Meteo.",
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/v1/weather/current?city=Alexandria&unit=celsius" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/weather/current?city=Alexandria", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const weather = await res.json();
console.log(weather.data.temperature); // 24°C`,
    pythonExample: `import requests
res = requests.get(
    "https://YOUR-DOMAIN/api/v1/weather/current",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"},
    params={"city": "Alexandria"}
)
print(res.json()["data"])`,
    responseExample: `{
  "success": true,
  "service": "weather",
  "data": {
    "location": { "name": "Alexandria", "country": "EG" },
    "temperature": 24,
    "feels_like": 25,
    "humidity": 62,
    "wind": { "speed": 4.2, "direction": 310 },
    "condition": { "main": "Clear", "description": "clear sky", "icon": "01d" },
    "unit": "celsius"
  }
}`
  },
  {
    path: "/api/v1/weather/forecast",
    method: "GET",
    title: "5-Day Weather Forecast",
    desc: "Predictive 3-hour interval weather forecast including precipitation probability and temperature ranges.",
    category: "weather",
    providers: ["OpenWeather API"],
    cacheTtl: "15m Cache",
    rateLimit: "120 req/min",
    params: [
      { name: "city", type: "string", required: false, description: "City name." },
      { name: "lat", type: "number", required: false, description: "Latitude coordinate." },
      { name: "lon", type: "number", required: false, description: "Longitude coordinate." },
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/v1/weather/forecast?city=Alexandria" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/weather/forecast?city=Alexandria", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const forecast = await res.json();`,
    pythonExample: `import requests
res = requests.get("https://YOUR-DOMAIN/api/v1/weather/forecast?city=Alexandria", headers={"Authorization": "Bearer YOUR_MORX_API_KEY"})`,
    responseExample: `{
  "success": true,
  "service": "weather",
  "data": {
    "location": { "name": "Alexandria" },
    "items": [
      { "timestamp": "2026-10-31T18:00:00Z", "temperature": 22, "precipitation_probability_percent": 10 }
    ]
  }
}`
  },
  {
    path: "/api/v1/weather/air-quality",
    method: "GET",
    title: "Air Quality Index (AQI)",
    desc: "Evaluates Air Quality Index (1: Good to 5: Hazardous) and micro-pollutant parts (PM2.5, PM10, CO).",
    category: "weather",
    providers: ["OpenWeather API"],
    cacheTtl: "15m Cache",
    rateLimit: "120 req/min",
    params: [
      { name: "lat", type: "number", required: true, description: "Latitude coordinate." },
      { name: "lon", type: "number", required: true, description: "Longitude coordinate." },
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/v1/weather/air-quality?lat=31.2&lon=29.9" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/weather/air-quality?lat=31.2&lon=29.9", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});`,
    pythonExample: `res = requests.get("https://YOUR-DOMAIN/api/v1/weather/air-quality?lat=31.2&lon=29.9", headers={"Authorization": "Bearer YOUR_MORX_API_KEY"})`,
    responseExample: `{
  "success": true,
  "service": "weather",
  "data": {
    "aqi": 2,
    "aqi_label": "Fair",
    "pollutants": { "pm2_5": 14.8, "pm10": 28.1 }
  }
}`
  },
  {
    path: "/api/v1/maps/geocode",
    method: "GET",
    title: "Address Geocoding",
    desc: "Converts any physical address or landmark into latitude & longitude coordinates with place metadata.",
    category: "maps",
    providers: ["Google Maps", "Mapbox (Failover)"],
    cacheTtl: "24h Cache",
    rateLimit: "120 req/min",
    params: [
      { name: "address", type: "string", required: true, description: "Landmark or address (e.g. 'Bibliotheca Alexandrina')." },
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/v1/maps/geocode?address=Bibliotheca+Alexandrina" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/maps/geocode?address=Bibliotheca+Alexandrina", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(data[0].coordinates); // { latitude: 31.2089, longitude: 29.9092 }`,
    pythonExample: `import requests
res = requests.get("https://YOUR-DOMAIN/api/v1/maps/geocode", headers={"Authorization": "Bearer YOUR_MORX_API_KEY"}, params={"address": "Bibliotheca Alexandrina"})`,
    responseExample: `{
  "success": true,
  "service": "maps",
  "data": [
    {
      "formatted_address": "Al Azaritah, Bab Sharqi, Alexandria",
      "coordinates": { "latitude": 31.208856, "longitude": 29.909247 },
      "place_id": "ChIJb_fA21i89RQRpD8lP_xX7z0"
    }
  ]
}`
  },
  {
    path: "/api/v1/maps/places",
    method: "GET",
    title: "Places & Venues Discovery",
    desc: "Search nearby restaurants, attractions, cafes, and hotels with ratings and open status within any radius.",
    category: "maps",
    providers: ["Google Maps Places"],
    cacheTtl: "30m Cache",
    rateLimit: "120 req/min",
    params: [
      { name: "query", type: "string", required: false, description: "Search keyword (e.g. 'Cafe near Citadel')." },
      { name: "lat", type: "number", required: false, description: "Center point latitude." },
      { name: "lon", type: "number", required: false, description: "Center point longitude." },
      { name: "radius", type: "number", required: false, defaultVal: "5000", description: "Search radius in meters." },
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/v1/maps/places?query=Cafe&lat=31.2001&lon=29.9187" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/maps/places?query=Cafe&lat=31.2001&lon=29.9187", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});`,
    pythonExample: `res = requests.get("https://YOUR-DOMAIN/api/v1/maps/places?query=Cafe", headers={"Authorization": "Bearer YOUR_MORX_API_KEY"})`,
    responseExample: `{
  "success": true,
  "service": "maps",
  "data": [
    { "name": "Sea View Cafe", "rating": 4.6, "open_now": true, "formatted_address": "Corniche, Alexandria" }
  ]
}`
  },
  {
    path: "/api/v1/maps/directions",
    method: "GET",
    title: "Turn-by-turn Navigation",
    desc: "Calculates driving, walking, or transit directions with estimated travel duration and route polyline.",
    category: "maps",
    providers: ["Google Directions", "Mapbox Directions"],
    cacheTtl: "5m Cache",
    rateLimit: "120 req/min",
    params: [
      { name: "origin", type: "string", required: true, description: "Start address or 'lat,lon'." },
      { name: "destination", type: "string", required: true, description: "End address or 'lat,lon'." },
      { name: "mode", type: "string", required: false, defaultVal: "driving", description: "'driving' | 'walking' | 'bicycling'" },
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/v1/maps/directions?origin=31.2,29.9&destination=31.21,29.95" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/maps/directions?origin=31.2,29.9&destination=31.21,29.95", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});`,
    pythonExample: `res = requests.get("https://YOUR-DOMAIN/api/v1/maps/directions?origin=31.2,29.9&destination=31.21,29.95", headers={"Authorization": "Bearer YOUR_MORX_API_KEY"})`,
    responseExample: `{
  "success": true,
  "service": "maps",
  "data": {
    "summary": "El-Geish Rd",
    "distance_meters": 4520,
    "duration_seconds": 610
  }
}`
  },
  {
    path: "/api/v1/routes/optimize",
    method: "POST",
    title: "Multi-Stop Route Optimizer (TSP)",
    desc: "Solves the Traveling Salesperson Problem to compute the shortest stop sequence, saving time and fuel.",
    category: "routing",
    providers: ["Internal 2-opt Heuristic (Zero Cost)", "Google Routes"],
    cacheTtl: "15m Cache",
    rateLimit: "120 req/min",
    params: [
      { name: "origin", type: "object", required: true, description: "{ lat: number, lon: number } - Starting coordinates." },
      { name: "stops", type: "array", required: true, description: "Stops to sequence: [{ id: 'A', lat: ..., lon: ... }]." },
      { name: "destination", type: "object", required: false, description: "Final endpoint (defaults to origin)." },
      { name: "provider", type: "string", required: false, defaultVal: "internal_tsp", description: "'internal_tsp' (free) | 'google_routes'" },
    ],
    importantNotes: [
      "Zero-Cost Guarantee: 'internal_tsp' uses local 2-opt algorithmic optimization with no external API charges.",
      "Returns the optimal stop sequence (e.g. ['C', 'A', 'B']) with individual leg distances and travel times.",
    ],
    requestExample: `{
  "origin": { "lat": 31.2001, "lon": 29.9187 },
  "stops": [
    { "id": "A", "lat": 31.2089, "lon": 29.9092 },
    { "id": "B", "lat": 31.2150, "lon": 29.9500 },
    { "id": "C", "lat": 31.1900, "lon": 29.9200 }
  ],
  "destination": { "lat": 31.1800, "lon": 29.9000 },
  "provider": "internal_tsp"
}`,
    curlExample: `curl -X POST "https://YOUR-DOMAIN/api/v1/routes/optimize" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"origin":{"lat":31.2001,"lon":29.9187},"stops":[{"id":"A","lat":31.2089,"lon":29.9092},{"id":"B","lat":31.215,"lon":29.95},{"id":"C","lat":31.19,"lon":29.92}]}'`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/routes/optimize", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_MORX_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    origin: { lat: 31.2001, lon: 29.9187 },
    stops: [
      { id: "A", lat: 31.2089, lon: 29.9092 },
      { id: "B", lat: 31.2150, lon: 29.9500 },
      { id: "C", lat: 31.1900, lon: 29.9200 }
    ]
  })
});
const opt = await res.json();
console.log(opt.data.optimized_order); // ["C", "A", "B"]`,
    pythonExample: `import requests
res = requests.post(
    "https://YOUR-DOMAIN/api/v1/routes/optimize",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"},
    json={"origin": {"lat": 31.2, "lon": 29.9}, "stops": [{"id": "A", "lat": 31.21, "lon": 29.91}]}
)
print(res.json()["data"]["optimized_order"])`,
    responseExample: `{
  "success": true,
  "service": "routing",
  "data": {
    "optimized_order": ["C", "A", "B"],
    "total_distance_meters": 13550,
    "total_duration_seconds": 1394,
    "algorithm": "internal_tsp_heuristic",
    "legs": [
      { "from_id": "ORIGIN", "to_id": "C", "distance_meters": 1130 },
      { "from_id": "C", "to_id": "A", "distance_meters": 2340 },
      { "from_id": "A", "to_id": "B", "distance_meters": 3980 }
    ]
  }
}`
  },
  {
    path: "/api/v1/routes/directions",
    method: "GET",
    title: "OSRMRoute Turn-by-Turn Directions",
    desc: "Computes turn-by-turn routing with distance, duration, steps, and GeoJSON geometry via OSRMRoute.",
    category: "routing",
    providers: ["OSRMRoute"],
    cacheTtl: "5m Cache",
    rateLimit: "120 req/min",
    params: [
      { name: "coordinates", type: "string", required: false, description: "Semicolon-separated lon,lat pairs: 'lon1,lat1;lon2,lat2'." },
      { name: "origin", type: "string", required: false, description: "Start coordinate: 'lat,lon' or 'lon,lat'." },
      { name: "destination", type: "string", required: false, description: "End coordinate: 'lat,lon' or 'lon,lat'." },
      { name: "profile", type: "string", required: false, defaultVal: "driving", description: "'driving' | 'cycling' | 'walking'" },
      { name: "overview", type: "string", required: false, defaultVal: "full", description: "'full' | 'simplified' | 'false'" },
      { name: "steps", type: "boolean", required: false, defaultVal: "true", description: "Whether to return turn-by-turn maneuvers." },
    ],
    importantNotes: [
      "OpenStreetMap compliance: Attribution 'Routing by OSRMRoute © OpenStreetMap contributors' included.",
      "High-throughput routing without external rate-limit throttling.",
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/v1/routes/directions?coordinates=29.9187,31.2001;29.9500,31.2200&profile=driving" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/routes/directions?coordinates=29.9187,31.2001;29.9500,31.2200&profile=driving", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(data.distance_meters, data.duration_seconds);`,
    pythonExample: `import requests
res = requests.get(
    "https://YOUR-DOMAIN/api/v1/routes/directions",
    headers={"Authorization": "Bearer YOUR_MORX_API_KEY"},
    params={"coordinates": "29.9187,31.2001;29.9500,31.2200", "profile": "driving"}
)
print(res.json()["data"])`,
    responseExample: `{
  "success": true,
  "service": "routing",
  "data": {
    "distance_meters": 4520,
    "duration_seconds": 320,
    "summary": "Route via El-Geish Rd",
    "steps": [
      {
        "instruction": "Head north on Corniche",
        "distance_meters": 450,
        "duration_seconds": 45
      }
    ]
  },
  "meta": {
    "provider": "osrmroute",
    "attribution": "Routing by OSRMRoute © OpenStreetMap contributors"
  }
}`
  },
  {
    path: "/api/v1/maps/isochrone",
    method: "GET",
    title: "Isochrone Reachability Contours",
    desc: "Calculates drive-time or walk-time polygons and reachability catchment zones around coordinates.",
    category: "maps",
    providers: ["Mapbox Isochrone v1"],
    cacheTtl: "60m Cache",
    rateLimit: "120 req/min",
    params: [
      { name: "lat", type: "number", required: true, description: "Center latitude coordinate." },
      { name: "lon", type: "number", required: true, description: "Center longitude coordinate." },
      { name: "profile", type: "string", required: false, defaultVal: "driving", description: "'driving' | 'walking' | 'cycling'" },
      { name: "contours", type: "string", required: false, defaultVal: "15,30", description: "Comma-separated minutes list (e.g. '10,20,30')." }
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/v1/maps/isochrone?lat=31.2001&lon=29.9187&contours=15,30" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/maps/isochrone?lat=31.2001&lon=29.9187&contours=15,30", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(data.features);`,
    pythonExample: `import requests
res = requests.get("https://YOUR-DOMAIN/api/v1/maps/isochrone?lat=31.2001&lon=29.9187", headers={"Authorization": "Bearer YOUR_MORX_API_KEY"})
print(res.json()["data"])`,
    responseExample: `{
  "success": true,
  "service": "maps",
  "data": {
    "center": { "latitude": 31.2001, "longitude": 29.9187 },
    "contours_minutes": [15, 30],
    "type": "FeatureCollection",
    "features": [
      { "type": "Feature", "properties": { "contour": 15, "fillColor": "#3b82f6" } }
    ]
  }
}`
  },
  {
    path: "/api/v1/utils/ip-lookup",
    method: "GET",
    title: "IP Geolocation & Network ISP",
    desc: "Resolves client IP or any target IP address into country, city, coordinates, timezone, and ASN/ISP.",
    category: "utils",
    providers: ["ipwho.is", "ip-api.com (Fallback)"],
    cacheTtl: "24h Cache",
    rateLimit: "300 req/min",
    params: [
      { name: "ip", type: "string", required: false, description: "IPv4 or IPv6 address (omit to auto-resolve client IP)." }
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/v1/utils/ip-lookup?ip=8.8.8.8" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/utils/ip-lookup?ip=8.8.8.8", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(data.city, data.country, data.isp);`,
    pythonExample: `import requests
res = requests.get("https://YOUR-DOMAIN/api/v1/utils/ip-lookup?ip=8.8.8.8", headers={"Authorization": "Bearer YOUR_MORX_API_KEY"})
print(res.json()["data"])`,
    responseExample: `{
  "success": true,
  "service": "utils",
  "data": {
    "ip": "8.8.8.8",
    "city": "Mountain View",
    "country": "United States",
    "country_code": "US",
    "coordinates": { "latitude": 37.4223, "longitude": -122.0848 },
    "timezone": "America/Los_Angeles",
    "isp": "Google LLC"
  }
}`
  },
  {
    path: "/api/v1/finance/exchange",
    method: "GET",
    title: "Foreign Exchange & Currency Converter",
    desc: "Retrieves live reference foreign exchange rates and currency conversion published by the European Central Bank.",
    category: "finance",
    providers: ["European Central Bank (Frankfurter)"],
    cacheTtl: "60m Cache",
    rateLimit: "300 req/min",
    params: [
      { name: "base", type: "string", required: false, defaultVal: "USD", description: "Base currency code (e.g. USD, EUR, GBP, EGP)." },
      { name: "target", type: "string", required: false, description: "Target currency code to convert to." },
      { name: "amount", type: "number", required: false, defaultVal: "1", description: "Currency amount to convert." }
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/v1/finance/exchange?base=USD&target=EUR&amount=100" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/finance/exchange?base=USD&target=EUR&amount=100", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(data.converted_amount);`,
    pythonExample: `import requests
res = requests.get("https://YOUR-DOMAIN/api/v1/finance/exchange?base=USD&target=EUR", headers={"Authorization": "Bearer YOUR_MORX_API_KEY"})
print(res.json()["data"])`,
    responseExample: `{
  "success": true,
  "service": "finance",
  "data": {
    "base": "USD",
    "target": "EUR",
    "amount": 100,
    "date": "2026-11-18",
    "converted_amount": 92.45,
    "rates": { "EUR": 0.9245, "GBP": 0.7892, "JPY": 154.2 }
  }
}`
  },
  {
    path: "/api/v1/news/search",
    method: "GET",
    title: "News Search & Media Headlining",
    desc: "Full-text article search across global news outlets with image thumbnails, author, and publication timestamp.",
    category: "news",
    providers: ["GNews API"],
    cacheTtl: "30m Cache",
    rateLimit: "120 req/min",
    params: [
      { name: "q", type: "string", required: false, defaultVal: "technology", description: "Topic keyword or query phrase." },
      { name: "limit", type: "number", required: false, defaultVal: "10", description: "Max articles to return (max: 10)." },
      { name: "lang", type: "string", required: false, defaultVal: "en", description: "Language ISO code (e.g. 'en', 'ar')." }
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/v1/news/search?q=technology&limit=5" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/news/search?q=technology&limit=5", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const { data } = await res.json();
console.log(data);`,
    pythonExample: `import requests
res = requests.get("https://YOUR-DOMAIN/api/v1/news/search?q=technology", headers={"Authorization": "Bearer YOUR_MORX_API_KEY"})
print(res.json()["data"])`,
    responseExample: `{
  "success": true,
  "service": "news",
  "data": [
    {
      "id": "https://example.com/article",
      "title": "Major API Advancements Unveiled",
      "description": "Unified architectures lead the future of enterprise software.",
      "url": "https://example.com/article",
      "published_at": "2026-11-18T12:00:00Z",
      "source": { "name": "Global Tech News" }
    }
  ]
}`
  },
  {
    path: "/api/cron/keep-alive",
    method: "GET",
    title: "Database Keep-Alive (Cron)",
    desc: "Pings Supabase once a day to generate database activity, preventing automatic 7-day inactivity pause.",
    category: "maintenance",
    providers: ["Supabase PostgreSQL Keep-Alive"],
    cacheTtl: "No Cache (Live)",
    rateLimit: "Unlimited",
    params: [
      { name: "key", type: "string", required: false, description: "Optional CRON_SECRET authorization key." },
    ],
    importantNotes: [
      "Set up on cron-job.org or UpTimeRobot to trigger once every 24 hours.",
      "Supports both GET and POST requests.",
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/cron/keep-alive"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/cron/keep-alive");
const status = await res.json();
console.log(status.message);`,
    pythonExample: `import requests
res = requests.get("https://YOUR-DOMAIN/api/cron/keep-alive")
print(res.json())`,
    responseExample: `{
  "success": true,
  "message": "Database keep-alive ping successful. Supabase project will stay active.",
  "data": { "recordsChecked": 15, "durationMs": 42 }
}`
  },
  {
    path: "/api/v1/tiktok/videos",
    method: "GET",
    title: "TikTok Creator Videos",
    desc: "Retrieves recent public videos and engagement metadata for an authorized creator account.",
    category: "social",
    providers: ["TikTok Display API"],
    cacheTtl: "15m Cache",
    rateLimit: "60 req/min",
    params: [
      { name: "max_count", type: "number", required: false, defaultVal: "20", description: "Number of videos to fetch (max: 50)." },
      { name: "cursor", type: "string", required: false, description: "Pagination cursor for subsequent video batches." },
    ],
    importantNotes: [
      "Requires creator OAuth token authorization with user.info.basic and video.list scopes.",
      "Responses are normalized into the standard Morx video envelope.",
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/v1/tiktok/videos?max_count=10" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/tiktok/videos", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const videos = await res.json();`,
    pythonExample: `import requests
res = requests.get("https://YOUR-DOMAIN/api/v1/tiktok/videos", headers={"Authorization": "Bearer YOUR_MORX_API_KEY"})
print(res.json()["data"])`,
    responseExample: `{
  "success": true,
  "service": "tiktok",
  "data": [
    {
      "id": "71987654321",
      "provider": "tiktok",
      "title": "Alexandria Sunset",
      "url": "https://www.tiktok.com/@creator/video/71987654321",
      "statistics": { "views": 45000, "likes": 3200 }
    }
  ]
}`
  },
  {
    path: "/api/v1/instagram/media",
    method: "GET",
    title: "Instagram User Media",
    desc: "Fetches photos, reels, and carousel media from an authorized Instagram Business or Creator account.",
    category: "social",
    providers: ["Instagram Graph API"],
    cacheTtl: "15m Cache",
    rateLimit: "60 req/min",
    params: [
      { name: "limit", type: "number", required: false, defaultVal: "25", description: "Number of media items to return." },
      { name: "after", type: "string", required: false, description: "Cursor for pagination after a specific post." },
    ],
    importantNotes: [
      "Uses official Instagram Graph API with instagram_basic scope.",
      "Includes permalink, caption, media_type, and engagement metrics.",
    ],
    curlExample: `curl -X GET "https://YOUR-DOMAIN/api/v1/instagram/media?limit=10" \\
  -H "Authorization: Bearer YOUR_MORX_API_KEY"`,
    jsExample: `const res = await fetch("https://YOUR-DOMAIN/api/v1/instagram/media", {
  headers: { "Authorization": "Bearer YOUR_MORX_API_KEY" }
});
const media = await res.json();`,
    pythonExample: `import requests
res = requests.get("https://YOUR-DOMAIN/api/v1/instagram/media", headers={"Authorization": "Bearer YOUR_MORX_API_KEY"})
print(res.json()["data"])`,
    responseExample: `{
  "success": true,
  "service": "instagram",
  "data": [
    {
      "id": "18023456789",
      "provider": "instagram",
      "media_type": "IMAGE",
      "caption": "Exploring the Mediterranean coast",
      "url": "https://www.instagram.com/p/ABC123xyz/"
    }
  ]
}`
  }
]


const SERVICE_HUBS = [
  {
    id: "videos",
    title: "Video Discovery",
    badge: "YouTube Data API v3",
    desc: "Search YouTube videos & shorts with verified view counts, creator info, and duration filters in < 50ms.",
    quickEndpoint: "/api/v1/videos/search?q=Alexandria",
    count: 1,
    icon: Video,
  },
  {
    id: "weather",
    title: "Weather Intelligence",
    badge: "OpenWeather API",
    desc: "Instant live temperature, 5-day predictive forecasts, and Air Quality Index (AQI with pollutants).",
    quickEndpoint: "/api/v1/weather/current?city=Alexandria",
    count: 3,
    icon: CloudSun,
  },
  {
    id: "maps",
    title: "Maps & Geolocation",
    badge: "Google Maps + Mapbox",
    desc: "Convert addresses to coordinates, explore places of interest, and turn-by-turn routing.",
    quickEndpoint: "/api/v1/maps/geocode?address=Alexandria",
    count: 3,
    icon: Compass,
  },
  {
    id: "routing",
    title: "Route Optimizer",
    badge: "Internal 2-Opt TSP (Free)",
    desc: "Sequence multi-stop delivery or tour routes with an instant zero-cost 2-Opt TSP heuristic solver.",
    quickEndpoint: "/api/v1/routes/optimize",
    count: 1,
    icon: Navigation,
  },
  {
    id: "social",
    title: "Social Media Feeds",
    badge: "TikTok & Instagram",
    desc: "Fetch authorized creator reels, media posts, captions, and engagement metrics into a unified format.",
    quickEndpoint: "/api/v1/tiktok/videos",
    count: 2,
    icon: Share2,
  },
];

export default function ApiPage() {
  const [activeView, setActiveView] = useState<"endpoints" | "docs">("endpoints")
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  
  // Clean accordion state: only expand one or keep lightweight
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [activeCardTab, setActiveCardTab] = useState<Record<string, "params" | "code" | "response" | "notes">>({})
  const [codeLanguage, setCodeLanguage] = useState<"curl" | "js" | "python">("curl")

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(id)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const toggleExpand = (path: string) => {
    setExpandedCard(expandedCard === path ? null : path)
  }

  const filteredEndpoints = ENDPOINTS.filter((ep) => {
    const matchesCategory = activeCategory === "all" || ep.category === activeCategory
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      ep.title.toLowerCase().includes(q) ||
      ep.path.toLowerCase().includes(q) ||
      ep.desc.toLowerCase().includes(q) ||
      ep.providers.some((p) => p.toLowerCase().includes(q))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="flex min-h-screen flex-col font-sans bg-background text-foreground antialiased selection:bg-primary/20">
      <Header />
      <ApiAccessGuard>
        <main className="flex-1 pb-24">
        
        {/* CLEAN DEVELOPER-FIRST HERO */}
        <section className="relative pt-20 pb-12 px-4 md:px-6 overflow-hidden border-b border-border/40">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            
            {/* Telemetry Status Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border/80 text-xs font-medium shadow-xs"
            >
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground font-mono">v1.0 Production Gateway</span>
              <span className="text-border">•</span>
              <span className="text-emerald-500 font-semibold font-mono">99.9% Uptime</span>
            </motion.div>

            {/* Clean, Non-Generic Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground"
            >
              The Unified API Gateway for <span className="bg-gradient-to-r from-primary via-indigo-500 to-sky-400 bg-clip-text text-transparent">Modern Apps</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35 }}
              className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
            >
              One API key. Standardized JSON responses. Integrated providers for Video Discovery, Weather, Maps, Route Optimization, and Social Media feeds.
            </motion.p>

            {/* Floating Action Badge & Demo Key */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.35 }}
              className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link
                href="/gateway"
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card hover:border-primary/50 transition-all border border-border/80 shadow-sm text-xs font-mono group"
              >
                <Key className="size-3.5 text-primary" />
                <span className="text-muted-foreground">API Access:</span>
                <span className="font-bold text-foreground group-hover:text-primary transition-colors">Issue & Manage API Keys</span>
                <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>

              <Link
                href="/gateway"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
              >
                <FlaskConical className="size-3.5" /> Testing Lab & Diagnostics <ArrowRight className="size-3.5" />
              </Link>
            </motion.div>

            {/* TACTILE SEGMENTED VIEW SWITCHER */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35 }}
              className="pt-4 flex items-center justify-center"
            >
              <div className="p-1 rounded-2xl bg-muted/70 border border-border/80 inline-flex items-center gap-1 shadow-xs">
                <button
                  onClick={() => setActiveView("endpoints")}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeView === "endpoints"
                      ? "bg-foreground text-background shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Layers className="size-3.5" />
                  <span>Endpoints Reference</span>
                </button>

                <button
                  onClick={() => setActiveView("docs")}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeView === "docs"
                      ? "bg-foreground text-background shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <BookOpen className="size-3.5" />
                  <span>Gateway Architecture & Specs</span>
                </button>
              </div>
            </motion.div>

          </div>
        </section>

        {/* VIEW 1: GATEWAY ARCHITECTURE & DETAILED DOCS */}
        {activeView === "docs" && (
          <section className="max-w-5xl mx-auto px-4 md:px-6 pt-8">
            <GatewayDocsView />
          </section>
        )}

        {/* VIEW 2: CLEAN, ORGANIZED ENDPOINTS EXPLORER */}
        {activeView === "endpoints" && (
          <>
            {/* 30-SECOND QUICKSTART FOR NEW DEVELOPERS */}
            <section className="max-w-5xl mx-auto px-4 md:px-6 pt-8">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="p-5 md:p-6 rounded-3xl bg-gradient-to-r from-card to-muted/20 border border-border/70 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                      <Zap className="size-3.5" />
                    </span>
                    <h3 className="font-bold text-sm text-foreground">30-Second Quickstart</h3>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg">
                    Ready for Instant Integration
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-card border border-border/50 space-y-1">
                    <div className="font-bold text-primary flex items-center gap-1.5">
                      <span className="size-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px]">1</span>
                      Generate API Key
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Create an API key in <Link href="/gateway" className="text-primary underline font-mono">Gateway Control</Link> with custom service access.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border/50 space-y-1">
                    <div className="font-bold text-primary flex items-center gap-1.5">
                      <span className="size-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px]">2</span>
                      Send Header
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed font-mono truncate">
                      Authorization: Bearer &lt;KEY&gt;
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border/50 space-y-1">
                    <div className="font-bold text-primary flex items-center gap-1.5">
                      <span className="size-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px]">3</span>
                      Receive Clean JSON
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Normalized envelope with complete telemetry in &lt; 50ms.
                    </p>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* VISUAL SERVICE HUBS (5 TACTILE CARDS) */}
            <section className="max-w-5xl mx-auto px-4 md:px-6 pt-6">
              <div className="flex items-center justify-between pb-3 text-xs">
                <span className="font-bold text-foreground">Integrated Services</span>
                <span className="text-muted-foreground text-[11px]">Click any card to filter endpoints</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SERVICE_HUBS.map((hub) => {
                  const Icon = hub.icon
                  const isSelected = activeCategory === hub.id
                  return (
                    <motion.div
                      key={hub.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => {
                        setActiveCategory(activeCategory === hub.id ? "all" : hub.id)
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected 
                          ? "bg-card border-primary/50 ring-1 ring-primary/30 shadow-sm" 
                          : "bg-card/70 border-border/60 hover:border-border hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">{hub.title}</h4>
                            <span className="text-[10px] text-muted-foreground font-mono">{hub.badge}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {hub.count} APIs
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2.5 line-clamp-2 leading-relaxed">
                        {hub.desc}
                      </p>
                      <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground/80 font-mono">Prefix: /api/v1</span>
                        <span className="text-primary font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          {isSelected ? "Clear filter ✕" : "Filter &rarr;"}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </section>

            {/* STICKY SEARCH & CATEGORY FILTER BAR */}
            <section className="sticky top-16 z-30 bg-background/85 backdrop-blur-xl border-b border-border/40 py-3 transition-all mt-4">
              <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-3">
                
                {/* Top Row: Responsive Search Input + Status & Quick Links */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Creative Search Bar */}
                  <div className="relative flex-1 sm:max-w-md">
                    <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search endpoints by path, keyword, or provider..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-9 py-2 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/70 shadow-xs"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status Indicators & Quick Lab Link */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-between sm:justify-end">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 text-[11px] font-medium">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {filteredEndpoints.length} APIs Available
                    </span>
                    <span className="font-mono text-[11px] bg-muted/40 px-2 py-1 rounded-lg">
                      Prefix: /api/v1
                    </span>
                    <Link
                      href="/gateway"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[11px] font-semibold"
                    >
                      <FlaskConical className="size-3" /> Testing Lab
                    </Link>
                  </div>
                </div>

                {/* Bottom Row: Category Navigation Pills (Smooth wrap, zero scrollbar on mobile or desktop) */}
                <div className="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap no-scrollbar scrollbar-none py-0.5">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    const isActive = activeCategory === cat.id
                    const count = cat.id === "all" 
                      ? ENDPOINTS.length 
                      : ENDPOINTS.filter(e => e.category === cat.id).length

                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
                          isActive
                            ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                            : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-muted/80 border-border/50"
                        }`}
                      >
                        <Icon className="size-3.5" />
                        <span>{cat.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isActive 
                            ? "bg-background/20 text-background" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>

              </div>
            </section>

            {/* ENDPOINTS LIST (CLEAN, MINIMALIST CARDS) */}
            <section className="max-w-5xl mx-auto px-4 md:px-6 pt-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-1">
                <span>Showing {filteredEndpoints.length} available endpoints</span>
                <span className="font-mono">Base URL: /api/v1</span>
              </div>

              <div className="space-y-3">
                {filteredEndpoints.map((ep) => {
                  const isExpanded = expandedCard === ep.path
                  const activeTab = activeCardTab[ep.path] || "params"

                  return (
                    <div
                      key={ep.path}
                      className={`rounded-2xl border transition-all duration-200 bg-card ${
                        isExpanded 
                          ? "border-primary/50 shadow-md ring-1 ring-primary/20" 
                          : "border-border/60 hover:border-border hover:shadow-xs"
                      }`}
                    >
                      {/* Card Bar (Minimalist initial row for clean reading) */}
                      <div
                        onClick={() => toggleExpand(ep.path)}
                        className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          {/* Method Badge */}
                          <span
                            className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg tracking-wider shrink-0 ${
                              ep.method === "GET"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            }`}
                          >
                            {ep.method}
                          </span>

                          {/* Path & Title */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="text-xs sm:text-sm font-mono font-bold text-foreground">
                                {ep.path}
                              </code>
                              <span className="text-[11px] text-muted-foreground hidden md:inline">
                                • {ep.title}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {ep.desc}
                            </p>
                          </div>
                        </div>

                        {/* Right side tags & Action buttons */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground hidden sm:inline">
                            {ep.cacheTtl}
                          </span>

                          <Link
                            href="/gateway"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] font-semibold text-primary hover:underline px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors hidden sm:inline-flex items-center gap-1"
                          >
                            <span>Test Live</span> &rarr;
                          </Link>
                          
                          <div
                            className={`size-7 rounded-full flex items-center justify-center transition-transform text-muted-foreground hover:text-foreground ${
                              isExpanded ? "rotate-180 text-primary" : ""
                            }`}
                          >
                            <ChevronDown className="size-4" />
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content Drawer */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-border/50 overflow-hidden"
                          >
                            <div className="p-4 sm:p-6 space-y-5 bg-muted/10">
                              
                              {/* Inner Tabs Navigation */}
                              <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setActiveCardTab({ ...activeCardTab, [ep.path]: "params" })}
                                    className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                                      activeTab === "params"
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    Parameters ({ep.params.length})
                                  </button>
                                  <button
                                    onClick={() => setActiveCardTab({ ...activeCardTab, [ep.path]: "code" })}
                                    className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                                      activeTab === "code"
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    <Code2 className="size-3" /> Code Example
                                  </button>
                                  <button
                                    onClick={() => setActiveCardTab({ ...activeCardTab, [ep.path]: "response" })}
                                    className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                                      activeTab === "response"
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    Response JSON
                                  </button>
                                  {ep.importantNotes && (
                                    <button
                                      onClick={() => setActiveCardTab({ ...activeCardTab, [ep.path]: "notes" })}
                                      className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                                        activeTab === "notes"
                                          ? "bg-primary text-primary-foreground"
                                          : "text-muted-foreground hover:text-foreground"
                                      }`}
                                    >
                                      <Info className="size-3" /> Key Details
                                    </button>
                                  )}
                                </div>

                                {/* Quick Action: Live Test Link */}
                                <Link
                                  href="/gateway"
                                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                >
                                  <FlaskConical className="size-3.5" /> Test in Lab
                                </Link>
                              </div>

                              {/* TAB 1: PARAMETERS */}
                              {activeTab === "params" && (
                                <div className="space-y-2">
                                  {ep.params.map((p, pIdx) => (
                                    <div
                                      key={pIdx}
                                      className="p-3 rounded-xl bg-card border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <code className="font-mono font-bold text-foreground">{p.name}</code>
                                        <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                                          {p.type}
                                        </span>
                                        {p.required ? (
                                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                                            Required
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-muted-foreground">
                                            Optional
                                          </span>
                                        )}
                                      </div>

                                      <div className="text-muted-foreground text-left sm:text-right">
                                        <span>{p.description}</span>
                                        {p.defaultVal && (
                                          <span className="ml-2 font-mono text-foreground font-semibold">
                                            (default: {p.defaultVal})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* TAB 2: CODE SNIPPETS */}
                              {activeTab === "code" && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                                      <button
                                        onClick={() => setCodeLanguage("curl")}
                                        className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors cursor-pointer ${
                                          codeLanguage === "curl" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground"
                                        }`}
                                      >
                                        cURL
                                      </button>
                                      <button
                                        onClick={() => setCodeLanguage("js")}
                                        className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors cursor-pointer ${
                                          codeLanguage === "js" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground"
                                        }`}
                                      >
                                        JavaScript (fetch)
                                      </button>
                                      <button
                                        onClick={() => setCodeLanguage("python")}
                                        className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors cursor-pointer ${
                                          codeLanguage === "python" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground"
                                        }`}
                                      >
                                        Python (requests)
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => {
                                        const code =
                                          codeLanguage === "curl"
                                            ? ep.curlExample
                                            : codeLanguage === "js"
                                            ? ep.jsExample
                                            : ep.pythonExample
                                        handleCopy(code, `${ep.path}-code`)
                                      }}
                                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                                    >
                                      {copiedText === `${ep.path}-code` ? (
                                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                                          <Check className="size-3" /> Copied Code!
                                        </span>
                                      ) : (
                                        <>
                                          <Copy className="size-3" /> Copy
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  <pre className="p-4 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-xs border border-zinc-800 overflow-x-auto whitespace-pre-wrap">
                                    {codeLanguage === "curl" && ep.curlExample}
                                    {codeLanguage === "js" && ep.jsExample}
                                    {codeLanguage === "python" && ep.pythonExample}
                                  </pre>
                                </div>
                              )}

                              {/* TAB 3: RESPONSE PREVIEW */}
                              {activeTab === "response" && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Standard Normalized Response Envelope</span>
                                    <button
                                      onClick={() => handleCopy(ep.responseExample, `${ep.path}-resp`)}
                                      className="hover:text-foreground flex items-center gap-1 cursor-pointer"
                                    >
                                      {copiedText === `${ep.path}-resp` ? (
                                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                                          <Check className="size-3" /> Copied JSON!
                                        </span>
                                      ) : (
                                        <>
                                          <Copy className="size-3" /> Copy JSON
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <pre className="p-4 rounded-xl bg-zinc-950 text-zinc-300 font-mono text-xs border border-zinc-800 overflow-x-auto max-h-64">
                                    {ep.responseExample}
                                  </pre>
                                </div>
                              )}

                              {/* TAB 4: KEY DETAILS & INSIGHTS */}
                              {activeTab === "notes" && ep.importantNotes && (
                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2 text-xs">
                                  <p className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                    <Zap className="size-3.5" /> Good to Know:
                                  </p>
                                  <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                                    {ep.importantNotes.map((note, idx) => (
                                      <li key={idx}>{note}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>

              {filteredEndpoints.length === 0 && (
                <div className="text-center py-16 border border-border/50 rounded-2xl bg-card/40 space-y-2">
                  <Search className="size-6 text-muted-foreground mx-auto" />
                  <p className="text-sm font-semibold">No endpoints found</p>
                  <p className="text-xs text-muted-foreground">Try clearing your search query.</p>
                </div>
              )}
            </section>
          </>
        )}

        {/* SIMPLE FOOTER CTA */}
        <section className="max-w-5xl mx-auto px-4 md:px-6 pt-16 text-center">
          <div className="p-8 rounded-3xl bg-muted/30 border border-border/60 space-y-4">
            <h3 className="text-xl font-bold">Need to test endpoints live?</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Our interactive Testing Lab lets you enter real parameters, execute live requests, and inspect server latencies in real time.
            </p>
            <Link
              href="/gateway"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Open Provider Testing Lab <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </section>

      </main>
      </ApiAccessGuard>
      <Footer />
    </div>
  )
}
