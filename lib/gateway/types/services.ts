/**
 * MORX API GATEWAY - Service Data Models & Normalized Schemas
 */

// ─── 1. VIDEO DISCOVERY ──────────────────────────────────────────────
export interface UnifiedVideoCreator {
  id: string;
  name: string;
  url?: string | null;
}

export interface UnifiedVideoStatistics {
  views: number | null;
  likes: number | null;
  comments: number | null;
}

export interface UnifiedVideo {
  id: string;
  provider: string;
  title: string;
  description: string;
  thumbnail: string | null;
  url: string;
  creator: UnifiedVideoCreator;
  published_at: string | null;
  duration_seconds: number | null;
  statistics: UnifiedVideoStatistics;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
}

// ─── 2. WEATHER ───────────────────────────────────────────────────────
export interface WeatherLocation {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
}

export interface WeatherCondition {
  main: string;
  description: string;
  icon: string | null;
}

export interface UnifiedWeatherCurrent {
  location: WeatherLocation;
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind: {
    speed: number;
    direction: number;
  };
  condition: WeatherCondition;
  cloud_coverage_percent: number;
  visibility_meters?: number;
  sunrise?: string | null;
  sunset?: string | null;
  unit: 'celsius' | 'fahrenheit' | 'kelvin';
  source: string;
}

export interface UnifiedForecastItem {
  timestamp: string;
  temperature: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  precipitation_probability_percent?: number | null;
  condition: WeatherCondition;
  wind_speed: number;
}

export interface UnifiedWeatherForecast {
  location: WeatherLocation;
  unit: 'celsius' | 'fahrenheit' | 'kelvin';
  source: string;
  items: UnifiedForecastItem[];
}

export interface UnifiedAirQuality {
  location: WeatherLocation;
  aqi: number; // 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = Very Poor
  aqi_label: 'Good' | 'Fair' | 'Moderate' | 'Poor' | 'Very Poor' | 'Unknown';
  pollutants: {
    co?: number;
    no?: number;
    no2?: number;
    o3?: number;
    so2?: number;
    pm2_5?: number;
    pm10?: number;
    nh3?: number;
  };
  source: string;
}

// ─── 3. MAPS & GEOLOCATION ───────────────────────────────────────────
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface UnifiedGeocodingResult {
  formatted_address: string;
  coordinates: Coordinates;
  place_id: string | null;
  types: string[];
  components: {
    street_number?: string;
    route?: string;
    locality?: string;
    administrative_area?: string;
    country?: string;
    postal_code?: string;
  };
}

export interface UnifiedPlace {
  id: string;
  name: string;
  formatted_address: string;
  coordinates: Coordinates;
  rating: number | null;
  user_ratings_total: number | null;
  types: string[];
  open_now: boolean | null;
  photo_reference?: string | null;
}

export interface RouteStep {
  instruction: string;
  distance_meters: number;
  duration_seconds: number;
  start_location: Coordinates;
  end_location: Coordinates;
}

export interface UnifiedDirections {
  summary?: string;
  origin: Coordinates | string;
  destination: Coordinates | string;
  distance_meters: number;
  duration_seconds: number;
  distanceMeters?: number;
  durationSeconds?: number;
  distanceFormatted?: string;
  durationFormatted?: string;
  duration_in_traffic_seconds?: number | null;
  steps: RouteStep[] | any[];
  polyline?: string | null;
  geometry?: any;
  waypoints?: any[];
  bounds?: {
    northeast: Coordinates;
    southwest: Coordinates;
  } | null;
}

export interface DistanceMatrixElement {
  origin_index: number;
  destination_index: number;
  distance_meters: number;
  duration_seconds: number;
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND';
}

export interface UnifiedDistanceMatrix {
  origins: (string | Coordinates)[];
  destinations: (string | Coordinates)[];
  matrix: DistanceMatrixElement[][];
}

// ─── 4. ROUTE OPTIMIZATION ───────────────────────────────────────────
export interface RouteStop {
  id: string;
  lat: number;
  lon: number;
  label?: string;
}

export interface UnifiedRouteOptimization {
  optimized_order: string[]; // List of stop IDs in optimal sequence
  total_distance_meters: number;
  total_duration_seconds: number;
  algorithm: 'google_routes' | 'internal_tsp_heuristic' | 'fallback_approximate';
  provider: string;
  legs: {
    from_id: string;
    to_id: string;
    distance_meters: number;
    duration_seconds: number;
  }[];
}

// ─── 5. INSTAGRAM PLATFORM ───────────────────────────────────────────
export interface UnifiedInstagramProfile {
  id: string;
  username: string;
  account_type?: string;
  media_count?: number;
  profile_picture_url?: string;
}

export interface UnifiedInstagramMedia {
  provider: 'instagram';
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'UNKNOWN';
  caption: string | null;
  media_url: string | null;
  permalink: string;
  thumbnail: string | null;
  published_at: string | null;
  like_count?: number | null;
  comments_count?: number | null;
}

export interface UnifiedInstagramReelOwner {
  id?: string;
  username: string;
  full_name?: string;
  profile_pic_url?: string;
}

export interface UnifiedInstagramReel {
  provider: 'apify' | 'rapidapi' | 'instagram';
  id: string;
  shortcode: string;
  caption: string | null;
  video_url: string | null;
  permalink: string;
  thumbnail: string | null;
  published_at: string | null;
  duration?: number | null;
  like_count: number | null;
  comments_count: number | null;
  views_count?: number | null;
  play_count?: number | null;
  shares_count?: number | null;
  owner: UnifiedInstagramReelOwner;
  hashtags: string[];
}

export interface UnifiedInstagramPost {
  provider: 'apify' | 'rapidapi' | 'instagram';
  id: string;
  shortcode: string;
  type: 'IMAGE' | 'CAROUSEL_ALBUM';
  caption: string | null;
  display_url: string;
  images: string[];
  permalink: string;
  published_at: string | null;
  like_count: number | null;
  comments_count: number | null;
  owner: UnifiedInstagramReelOwner;
  hashtags: string[];
}

// ─── 7. GEOSPATIAL ISOCHRONE ──────────────────────────────────────────
export interface UnifiedIsochrone {
  center: Coordinates;
  contours_minutes: number[];
  type: string;
  features: Array<{
    type: string;
    geometry: {
      type: string;
      coordinates: any;
    };
    properties: {
      contour: number;
      fillColor?: string;
      opacity?: number;
      metric: string;
    };
  }>;
}

// ─── 8. IP GEOLOCATION UTILITIES ─────────────────────────────────────
export interface UnifiedIpLookup {
  ip: string;
  city: string;
  region?: string;
  country: string;
  country_code?: string;
  coordinates: Coordinates;
  timezone?: string;
  isp?: string;
  org?: string;
}

// ─── 9. FINANCIAL & CURRENCY EXCHANGE ────────────────────────────────
export interface UnifiedExchangeRate {
  base: string;
  target?: string;
  amount: number;
  date: string;
  converted_amount?: number;
  rates: Record<string, number>;
}

// ─── 10. NEWS & MEDIA FEEDS ──────────────────────────────────────────
export interface UnifiedNewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  image?: string | null;
  published_at: string;
  source: {
    name: string;
    url?: string;
  };
}

// ─── 11. STREAMING & MEDIA EMBEDS (VIDORA) ───────────────────────────
export interface UnifiedStreamingCustomization {
  primaryColor?: string;
  secondaryColor?: string;
  iconColor?: string;
  title?: boolean;
  poster?: boolean;
  autoplay?: boolean;
  nextbutton?: boolean;
  startAt?: number;
  sub_file?: string;
  sub_label?: string;
  fallback_url?: string;
}

export interface UnifiedStreamingEmbed {
  provider: 'vidora';
  type: 'movie' | 'tv' | 'anime';
  id: string | number;
  season?: number;
  episode?: number;
  subOrDub?: 'sub' | 'dub';
  fallback?: boolean;
  embed_url: string;
  iframe_tag: string;
  customization?: UnifiedStreamingCustomization;
  supported_features: {
    resolutions: string[];
    dubs: boolean;
    subtitles: boolean;
    postmessage_events: boolean;
    localstorage_progress_sync: boolean;
  };
  documentation_url: string;
}

