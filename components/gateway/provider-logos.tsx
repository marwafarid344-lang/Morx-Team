import React from "react";

export function YouTubeLogo({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="YouTube">
      <path
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        fill="#FF0000"
      />
      <polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="#FFFFFF" />
    </svg>
  );
}

export function TikTokLogo({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="TikTok">
      <rect width="24" height="24" rx="5" fill="#010101" />
      <path
        d="M17.8 7.2a4.4 4.4 0 0 1-2.9-2.3V4h-2.5v11.2a2.3 2.3 0 1 1-2.3-2.3c.25 0 .5.04.72.12V10.4a4.8 4.8 0 0 0-.72-.05 4.8 4.8 0 1 0 4.8 4.8V9.3a6.8 6.8 0 0 0 3.9 1.2V8a4.4 4.4 0 0 1-1-.8z"
        fill="#25F4EE"
        transform="translate(-0.5, -0.5)"
      />
      <path
        d="M17.8 7.2a4.4 4.4 0 0 1-2.9-2.3V4h-2.5v11.2a2.3 2.3 0 1 1-2.3-2.3c.25 0 .5.04.72.12V10.4a4.8 4.8 0 0 0-.72-.05 4.8 4.8 0 1 0 4.8 4.8V9.3a6.8 6.8 0 0 0 3.9 1.2V8a4.4 4.4 0 0 1-1-.8z"
        fill="#FE2C55"
        transform="translate(0.5, 0.5)"
      />
      <path
        d="M17.8 7.2a4.4 4.4 0 0 1-2.9-2.3V4h-2.5v11.2a2.3 2.3 0 1 1-2.3-2.3c.25 0 .5.04.72.12V10.4a4.8 4.8 0 0 0-.72-.05 4.8 4.8 0 1 0 4.8 4.8V9.3a6.8 6.8 0 0 0 3.9 1.2V8a4.4 4.4 0 0 1-1-.8z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function InstagramLogo({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="Instagram">
      <defs>
        <radialGradient id="ig-rg-brand" cx="20%" cy="110%" r="130%">
          <stop offset="0%" stopColor="#ffda77" />
          <stop offset="15%" stopColor="#fca951" />
          <stop offset="40%" stopColor="#f35151" />
          <stop offset="70%" stopColor="#c12e9b" />
          <stop offset="100%" stopColor="#4c63d2" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig-rg-brand)" />
      <rect x="4" y="4" width="16" height="16" rx="4.5" stroke="#ffffff" strokeWidth="1.6" fill="none" />
      <circle cx="12" cy="12" r="3.7" stroke="#ffffff" strokeWidth="1.6" fill="none" />
      <circle cx="16.5" cy="7.5" r="1.1" fill="#ffffff" />
    </svg>
  );
}

export function GoogleMapsLogo({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="Google Maps">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335" />
      <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.8 2.88 7.15L12 9.5V2z" fill="#4285F4" />
      <path d="M12 9.5l-4.12 6.65C9.28 18.2 10.74 20.2 12 22V9.5z" fill="#34A853" />
      <path d="M12 9.5V22c1.26-1.8 2.72-3.8 4.12-5.85L12 9.5z" fill="#FBBC04" />
      <circle cx="12" cy="9" r="3.2" fill="#FFFFFF" />
    </svg>
  );
}

export function OpenWeatherLogo({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="OpenWeather">
      <rect width="24" height="24" rx="5" fill="#EB6E4B" />
      <circle cx="16.5" cy="8.5" r="3" fill="#FFD15C" />
      <path
        d="M7.5 16.5a3.5 3.5 0 0 1 3.4-2.8c.3 0 .6.04.88.13A4.5 4.5 0 0 1 16 9.5a4.5 4.5 0 0 1 4.4 3.55A3.5 3.5 0 0 1 19.5 20h-12a3.5 3.5 0 0 1 0-3.5z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function OpenMeteoLogo({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="Open-Meteo">
      <rect width="24" height="24" rx="5" fill="#0284C7" />
      <path d="M4 14l4-5 4 3 4-6 4 4" stroke="#7DD3FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="6" r="2" fill="#FACC15" />
      <path d="M5 19h14" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function OSRMRouteLogo({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="OSRM Routing">
      <rect width="24" height="24" rx="5" fill="#059669" />
      <path
        d="M6 17c0-2.5 2-4.5 4.5-4.5H13V9l5 4-5 4v-2.5h-2.5c-1.5 0-2.5 1-2.5 2.5v1H6v-1z"
        fill="#FFFFFF"
      />
      <circle cx="7" cy="17" r="2" fill="#34D399" />
      <circle cx="18" cy="13" r="2" fill="#A7F3D0" />
    </svg>
  );
}

export function FrankfurterLogo({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="Frankfurter ECB">
      <circle cx="12" cy="12" r="11" fill="#003399" />
      <path
        d="M15.5 8.2a4.3 4.3 0 0 0-6.8 2.3h3.5v1.4H8.2a4.3 4.3 0 0 0 0 1H12v1.4H8.7a4.3 4.3 0 0 0 6.8 2.3l-1.1-1.3a3 3 0 0 1-4.2-1H15v-1.4h-5.2a3 3 0 0 1 0-1H15v-1.4h-4.8a3 3 0 0 1 4-1l1.3-1.3z"
        fill="#FFCC00"
      />
      <circle cx="12" cy="3.5" r="0.8" fill="#FFCC00" />
      <circle cx="12" cy="20.5" r="0.8" fill="#FFCC00" />
      <circle cx="3.5" cy="12" r="0.8" fill="#FFCC00" />
      <circle cx="20.5" cy="12" r="0.8" fill="#FFCC00" />
    </svg>
  );
}

export function GNewsLogo({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="GNews">
      <rect width="24" height="24" rx="5" fill="#1A73E8" />
      <rect x="4" y="5" width="16" height="14" rx="2" fill="#FFFFFF" />
      <rect x="6" y="7" width="5" height="5" rx="1" fill="#EA4335" />
      <line x1="13" y1="8" x2="18" y2="8" stroke="#5F6368" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="13" y1="10.5" x2="18" y2="10.5" stroke="#5F6368" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="6" y1="14" x2="18" y2="14" stroke="#5F6368" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="16.5" x2="14" y2="16.5" stroke="#5F6368" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IpGeolocationLogo({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="IP Geolocation">
      <circle cx="12" cy="12" r="11" fill="#4338CA" />
      <circle cx="12" cy="12" r="7.5" stroke="#818CF8" strokeWidth="1" strokeDasharray="2 2" fill="none" />
      <ellipse cx="12" cy="12" rx="4.5" ry="9.5" stroke="#C7D2FE" strokeWidth="1" fill="none" />
      <line x1="2.5" y1="12" x2="21.5" y2="12" stroke="#C7D2FE" strokeWidth="1" />
      <circle cx="12" cy="12" r="2.8" fill="#38BDF8" />
      <circle cx="12" cy="12" r="1.1" fill="#FFFFFF" />
    </svg>
  );
}

export function MapboxLogo({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="Mapbox">
      <rect width="24" height="24" rx="5" fill="#314CCD" />
      <path d="M6 17V7l6 4 6-4v10l-6-3.5L6 17z" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Universal Brand Logo Dispatcher
 */
export function ProviderBrandLogo({
  name,
  className = "size-4 shrink-0",
}: {
  name: string;
  className?: string;
}) {
  const norm = name.toLowerCase().replace(/[-_\s]/g, "");

  if (norm.includes("youtube") || norm === "videos") return <YouTubeLogo className={className} />;
  if (norm.includes("tiktok")) return <TikTokLogo className={className} />;
  if (norm.includes("instagram")) return <InstagramLogo className={className} />;
  if (norm.includes("openmeteo")) return <OpenMeteoLogo className={className} />;
  if (norm.includes("weather") || norm.includes("openweather")) return <OpenWeatherLogo className={className} />;
  if (norm.includes("mapbox")) return <MapboxLogo className={className} />;
  if (norm.includes("maps") || norm.includes("googlemaps") || norm.includes("places")) return <GoogleMapsLogo className={className} />;
  if (norm.includes("osrm") || norm.includes("routing") || norm.includes("routes") || norm.includes("tsp")) return <OSRMRouteLogo className={className} />;
  if (norm.includes("frankfurter") || norm.includes("finance") || norm.includes("exchange") || norm.includes("ecb")) return <FrankfurterLogo className={className} />;
  if (norm.includes("news") || norm.includes("gnews")) return <GNewsLogo className={className} />;
  if (norm.includes("ip") || norm.includes("geo") || norm.includes("utils")) return <IpGeolocationLogo className={className} />;

  // Default fallback
  return <GoogleMapsLogo className={className} />;
}
