import { ProviderComplianceConfig, ComplianceStatus, AttributionRequirement } from './types';
import { ServiceCategory } from '../types';

export class ComplianceRegistry {
  private static registry: Map<string, ProviderComplianceConfig> = new Map();

  static {
    // 1. YouTube Data API v3
    this.register({
      providerName: 'youtube',
      service: 'videos',
      officialDocumentation: 'https://developers.google.com/youtube/v3',
      applicableAgreement: 'YouTube API Services Terms of Service & Developer Policies (III.A / III.D.2)',
      complianceStatus: 'APPROVED',
      approvedUseCases: [
        'Internal Morx UI displaying video cards with official YouTube IFrame embedded player',
      ],
      allowedOperations: ['search', 'details'],
      prohibitedOperations: [
        'cache_audiovisual_streams',
        'download_video_or_audio',
        'aggregate_unrelated_content_owners',
        'store_metadata_beyond_30_days',
      ],
      dataRedistributionPolicy: 'TRANSFORMED_ONLY',
      dataRetentionPolicy: {
        maxStorageDays: 30,
        allowPermanentStorage: false,
        deletionOnRevocationRequired: true,
      },
      cachingPolicy: {
        allowed: true,
        maxTtlSeconds: 1800, // Max 30 minutes in memory metadata only
        prohibitedDataTypes: ['video_file', 'audio_stream', 'raw_media', 'mp4'],
        allowPersistentStorage: false,
      },
      attributionRequirements: {
        required: true,
        displayText: 'Powered by YouTube',
        logoUrl: 'https://www.youtube.com/yt/about/media/downloads/YouTube_Logo_White.png',
        linkUrl: 'https://www.youtube.com',
        placement: 'inline',
      },
      oauthRequirements: {
        required: false,
        appReviewRequired: true,
      },
      geographicRestrictions: [],
      clientEligibility: 'all',
      requiredApprovals: ['Google YouTube Partner Program Written Authorization'],
      restrictionReason: 'YouTube Developer Policies (Section III.A) strictly prohibit offering an API service allowing users/arbitrary developers to access YouTube API data or functionality indirectly. External third-party developer proxying is BLOCKED_PENDING_APPROVAL.',
      lastReviewedDate: '2026-11-18',
    });

    // 2. Google Maps Platform
    this.register({
      providerName: 'google_maps',
      service: 'maps',
      officialDocumentation: 'https://developers.google.com/maps',
      applicableAgreement: 'Google Maps Platform Terms of Service & Service Specific Terms §3.2.3 / §3.2.4',
      complianceStatus: 'CONDITIONAL',
      approvedUseCases: [
        'Address geocoding and verification displayed on official Google Maps canvas',
        'Place discovery and details with required Google attribution',
      ],
      allowedOperations: ['geocode', 'reverse_geocode', 'places', 'details', 'directions', 'distance_matrix'],
      prohibitedOperations: [
        'co_mingle_content_with_non_google_maps',
        'display_google_content_on_mapbox_canvas',
        'bulk_export_maps_database',
        'store_response_fields_permanently',
      ],
      dataRedistributionPolicy: 'TRANSFORMED_ONLY',
      dataRetentionPolicy: {
        maxStorageDays: 30,
        allowPermanentStorage: false,
        deletionOnRevocationRequired: true,
      },
      cachingPolicy: {
        allowed: true,
        maxTtlSeconds: 86400 * 30, // Max 30 days for place_id / coordinates
        prohibitedDataTypes: ['street_view_tiles', 'raw_imagery', 'full_response_export'],
        allowPersistentStorage: false,
      },
      attributionRequirements: {
        required: true,
        displayText: 'Powered by Google Maps Platform',
        logoUrl: 'https://maps.gstatic.com/tactile/common/google_logo_white.png',
        linkUrl: 'https://cloud.google.com/maps-platform',
        placement: 'inline',
      },
      oauthRequirements: {
        required: false,
      },
      geographicRestrictions: [],
      clientEligibility: 'enterprise_only',
      requiredApprovals: ['GCP Geocoding & Places API Enablement'],
      restrictionReason: 'Must strictly display on Google Maps canvas; co-mingling with OpenStreetMap/Mapbox canvas is prohibited by Terms §3.2.3.',
      lastReviewedDate: '2026-11-18',
    });

    // 3. Mapbox
    this.register({
      providerName: 'mapbox',
      service: 'maps',
      officialDocumentation: 'https://docs.mapbox.com/api/',
      applicableAgreement: 'Mapbox Terms of Service & Product Terms',
      complianceStatus: 'APPROVED',
      approvedUseCases: [
        'Forward and reverse geocoding for logistics and travel',
        'Routing and distance calculations for team planning',
        'Independent fallback geocoding without Google Maps co-mingling',
      ],
      allowedOperations: ['geocode', 'reverse_geocode', 'places', 'directions', 'matrix', 'isochrone'],
      prohibitedOperations: [
        'cache_standard_geocoding_permanently',
        'redistribute_raw_vector_tiles_outside_session',
      ],
      dataRedistributionPolicy: 'TRANSFORMED_ONLY',
      dataRetentionPolicy: {
        maxStorageDays: 30,
        allowPermanentStorage: false,
        deletionOnRevocationRequired: false,
      },
      cachingPolicy: {
        allowed: true,
        maxTtlSeconds: 86400 * 7,
        prohibitedDataTypes: ['raw_vector_tiles'],
        allowPersistentStorage: false,
      },
      attributionRequirements: {
        required: true,
        displayText: '© Mapbox © OpenStreetMap',
        linkUrl: 'https://www.mapbox.com/about/maps/',
        placement: 'metadata',
      },
      oauthRequirements: {
        required: false,
      },
      geographicRestrictions: [],
      clientEligibility: 'all',
      requiredApprovals: [],
      lastReviewedDate: '2026-11-18',
    });

    // 4. OpenWeather
    this.register({
      providerName: 'openweather',
      service: 'weather',
      officialDocumentation: 'https://openweathermap.org/api',
      applicableAgreement: 'OpenWeather Terms and Conditions & Open Data License',
      complianceStatus: 'CONDITIONAL',
      approvedUseCases: [
        'Weather telemetry display for team outdoor activities and trip planning',
        'Air Quality Index analysis and alerts',
      ],
      allowedOperations: ['current', 'forecast', 'air_quality'],
      prohibitedOperations: [
        'resell_raw_meteorological_database',
        'sublicense_unmodified_weather_feed',
        'claim_proprietary_forecast_creation',
      ],
      dataRedistributionPolicy: 'TRANSFORMED_ONLY',
      dataRetentionPolicy: {
        maxStorageDays: 1,
        allowPermanentStorage: false,
        deletionOnRevocationRequired: false,
      },
      cachingPolicy: {
        allowed: true,
        maxTtlSeconds: 600, // 10 minutes current weather TTL
        prohibitedDataTypes: ['unfiltered_raw_feed_dump'],
        allowPersistentStorage: false,
      },
      attributionRequirements: {
        required: true,
        displayText: 'Weather data provided by OpenWeather',
        linkUrl: 'https://openweathermap.org',
        placement: 'metadata',
      },
      oauthRequirements: {
        required: false,
      },
      geographicRestrictions: [],
      clientEligibility: 'enterprise_only',
      requiredApprovals: [],
      restrictionReason: 'Standard API tier prohibits raw feed resale. Commercial redistribution requires transformed integration and attribution.',
      lastReviewedDate: '2026-11-18',
    });

    // 5. Open-Meteo Weather Intelligence Service
    this.register({
      providerName: 'open_meteo',
      service: 'weather',
      officialDocumentation: 'https://open-meteo.com',
      applicableAgreement: 'Open-Meteo Terms of Service & Open Database License (ODbL)',
      complianceStatus: 'APPROVED',
      approvedUseCases: [
        'Real-time temperature, wind, and atmospheric pressure forecasting',
        'Multi-day predictive weather forecasting and air quality monitoring',
      ],
      allowedOperations: ['current', 'forecast', 'air_quality'],
      prohibitedOperations: [],
      dataRedistributionPolicy: 'LICENSED_PERMITTED',
      dataRetentionPolicy: {
        maxStorageDays: 30,
        allowPermanentStorage: true,
        deletionOnRevocationRequired: false,
      },
      cachingPolicy: {
        allowed: true,
        maxTtlSeconds: 600, // 10 minutes current weather TTL
        prohibitedDataTypes: [],
        allowPersistentStorage: true,
      },
      attributionRequirements: {
        required: true,
        displayText: 'Weather data by Open-Meteo.com',
        linkUrl: 'https://open-meteo.com',
        placement: 'metadata',
      },
      oauthRequirements: {
        required: false,
      },
      geographicRestrictions: [],
      clientEligibility: 'all',
      requiredApprovals: [],
      lastReviewedDate: '2026-11-18',
    });

    // 6. Instagram / Meta Platform
    this.register({
      providerName: 'instagram',
      service: 'instagram',
      officialDocumentation: 'https://developers.facebook.com/documentation/instagram-platform/',
      applicableAgreement: 'Meta Platform Terms §3.a, §4 & Developer Policies',
      complianceStatus: 'BLOCKED_PENDING_APPROVAL',
      approvedUseCases: [
        'Authorized user media display via official Instagram Graph API OAuth flow',
      ],
      allowedOperations: ['feed', 'profile', 'media_details'],
      prohibitedOperations: [
        'unauthorized_post_or_hashtag_scraping',
        'proxy_master_credentials_to_third_party_developers',
        'co_mingle_user_data_across_unrelated_clients',
        'retain_data_post_account_deauthorization',
      ],
      dataRedistributionPolicy: 'TRANSFORMED_ONLY',
      dataRetentionPolicy: {
        maxStorageDays: 1,
        allowPermanentStorage: false,
        deletionOnRevocationRequired: true,
      },
      cachingPolicy: {
        allowed: true,
        maxTtlSeconds: 86400, // 24 hours max
        prohibitedDataTypes: ['raw_media_blobs', 'user_credentials'],
        allowPersistentStorage: false,
      },
      attributionRequirements: {
        required: true,
        displayText: 'Powered by Instagram Graph API',
        linkUrl: 'https://www.instagram.com',
        placement: 'inline',
      },
      oauthRequirements: {
        required: true,
        requiredScopes: ['instagram_basic', 'instagram_manage_insights'],
        appReviewRequired: true,
      },
      geographicRestrictions: [],
      clientEligibility: 'all',
      requiredApprovals: ['Meta Business Verification', 'App Review Permissions'],
      restrictionReason: 'Meta Platform Terms prohibit unauthorized scraping and multi-client key proxying without completed App Review and Data Deletion Callback verification.',
      lastReviewedDate: '2026-11-18',
    });

    // 7. Google Routes
    this.register({
      providerName: 'google_routes',
      service: 'routing',
      officialDocumentation: 'https://developers.google.com/maps/documentation/routes',
      applicableAgreement: 'Google Maps Platform Routes API Terms',
      complianceStatus: 'CONDITIONAL',
      approvedUseCases: [
        'Directions and matrix navigation displayed on Google Maps canvas',
      ],
      allowedOperations: ['directions', 'matrix'],
      prohibitedOperations: [
        'display_on_non_google_maps_canvas',
        'permanent_route_storage',
      ],
      dataRedistributionPolicy: 'TRANSFORMED_ONLY',
      dataRetentionPolicy: {
        maxStorageDays: 30,
        allowPermanentStorage: false,
        deletionOnRevocationRequired: true,
      },
      cachingPolicy: {
        allowed: true,
        maxTtlSeconds: 86400,
        prohibitedDataTypes: ['polyline_geometry_export'],
        allowPersistentStorage: false,
      },
      attributionRequirements: {
        required: true,
        displayText: 'Routes by Google Maps Platform',
        linkUrl: 'https://cloud.google.com/maps-platform/routes',
        placement: 'metadata',
      },
      oauthRequirements: {
        required: false,
      },
      geographicRestrictions: [],
      clientEligibility: 'enterprise_only',
      requiredApprovals: ['GCP Routes API Enablement'],
      restrictionReason: 'Requires Google Maps canvas for visual presentation; cannot be co-mingled with third-party map tiles.',
      lastReviewedDate: '2026-11-18',
    });

    // 8. OSRMRoute
    this.register({
      providerName: 'osrmroute',
      service: 'routing',
      officialDocumentation: 'https://osrmroute.com',
      applicableAgreement: 'OSRMRoute Hosted Service Terms & OpenStreetMap License (ODbL)',
      complianceStatus: 'APPROVED',
      approvedUseCases: [
        'Point-to-point and multi-coordinate turn-by-turn road navigation',
        'Travel duration and route distance estimation with OpenStreetMap road networks',
      ],
      allowedOperations: ['directions', 'route'],
      prohibitedOperations: [
        'reverse_compile_proprietary_hosting_architecture',
      ],
      dataRedistributionPolicy: 'LICENSED_PERMITTED',
      dataRetentionPolicy: {
        maxStorageDays: 30,
        allowPermanentStorage: true,
        deletionOnRevocationRequired: false,
      },
      cachingPolicy: {
        allowed: true,
        maxTtlSeconds: 86400 * 3,
        prohibitedDataTypes: [],
        allowPersistentStorage: true,
      },
      attributionRequirements: {
        required: true,
        displayText: 'Routing by OSRMRoute © OpenStreetMap contributors',
        linkUrl: 'https://osrmroute.com',
        placement: 'metadata',
      },
      oauthRequirements: {
        required: false,
      },
      geographicRestrictions: [],
      clientEligibility: 'all',
      requiredApprovals: [],
      lastReviewedDate: '2026-11-18',
    });

    // 9. Internal TSP Routing Engine (Proprietary Morx)
    this.register({
      providerName: 'internal_tsp',
      service: 'routing',
      officialDocumentation: 'Morx Internal Algorithm Engine Documentation',
      applicableAgreement: 'Proprietary Morx Enterprise Software License',
      complianceStatus: 'APPROVED',
      approvedUseCases: [
        'Full Travelling Salesperson Problem (TSP) multi-stop optimization',
        'Fleet and trip sequencing for team meetups and delivery routes',
      ],
      allowedOperations: ['optimize', 'matrix', 'directions'],
      prohibitedOperations: [],
      dataRedistributionPolicy: 'LICENSED_PERMITTED',
      dataRetentionPolicy: {
        maxStorageDays: 365,
        allowPermanentStorage: true,
        deletionOnRevocationRequired: false,
      },
      cachingPolicy: {
        allowed: true,
        maxTtlSeconds: 86400 * 7,
        prohibitedDataTypes: [],
        allowPersistentStorage: true,
      },
      attributionRequirements: {
        required: false,
        displayText: 'Morx Intelligent Routing Engine',
        linkUrl: 'https://morx.corp',
        placement: 'metadata',
      },
      oauthRequirements: {
        required: false,
      },
      geographicRestrictions: [],
      clientEligibility: 'all',
      requiredApprovals: [],
      lastReviewedDate: '2026-11-18',
    });

    // 10. IP Geolocation (ipwho.is / ip-api)
    this.register({
      providerName: 'ip_geolocation',
      service: 'utils',
      officialDocumentation: 'https://ipwhois.io/documentation',
      applicableAgreement: 'IPWhois Terms of Service & Free API Usage Policy',
      complianceStatus: 'APPROVED',
      approvedUseCases: ['Client IP lookup', 'Country and city detection for localized routing'],
      allowedOperations: ['lookup', 'ip_lookup'],
      prohibitedOperations: [],
      dataRedistributionPolicy: 'TRANSFORMED_ONLY',
      dataRetentionPolicy: {
        maxStorageDays: 30,
        allowPermanentStorage: false,
        deletionOnRevocationRequired: false,
      },
      cachingPolicy: {
        allowed: true,
        maxTtlSeconds: 86400,
        prohibitedDataTypes: [],
        allowPersistentStorage: false,
      },
      attributionRequirements: {
        required: false,
        displayText: 'IP Geolocation by ipwho.is',
        linkUrl: 'https://ipwho.is',
        placement: 'metadata',
      },
      oauthRequirements: { required: false },
      geographicRestrictions: [],
      clientEligibility: 'all',
      requiredApprovals: [],
      lastReviewedDate: '2026-11-18',
    });

    // 11. Frankfurter Currency Rates (European Central Bank)
    this.register({
      providerName: 'frankfurter',
      service: 'finance',
      officialDocumentation: 'https://frankfurter.dev/',
      applicableAgreement: 'Frankfurter Open Source License & European Central Bank Public Data',
      complianceStatus: 'APPROVED',
      approvedUseCases: ['Currency conversion', 'Foreign exchange rates tracking'],
      allowedOperations: ['rates', 'convert', 'exchange'],
      prohibitedOperations: [],
      dataRedistributionPolicy: 'LICENSED_PERMITTED',
      dataRetentionPolicy: {
        maxStorageDays: 365,
        allowPermanentStorage: true,
        deletionOnRevocationRequired: false,
      },
      cachingPolicy: {
        allowed: true,
        maxTtlSeconds: 3600,
        prohibitedDataTypes: [],
        allowPersistentStorage: true,
      },
      attributionRequirements: {
        required: true,
        displayText: 'Data published by European Central Bank via Frankfurter',
        linkUrl: 'https://frankfurter.dev',
        placement: 'metadata',
      },
      oauthRequirements: { required: false },
      geographicRestrictions: [],
      clientEligibility: 'all',
      requiredApprovals: [],
      lastReviewedDate: '2026-11-18',
    });

    // 12. GNews API
    this.register({
      providerName: 'gnews',
      service: 'news',
      officialDocumentation: 'https://gnews.io/docs/v4',
      applicableAgreement: 'GNews API Terms of Service',
      complianceStatus: 'APPROVED',
      approvedUseCases: ['Global news search', 'Top headline aggregation with source attribution'],
      allowedOperations: ['search', 'top_headlines'],
      prohibitedOperations: ['cache_articles_permanently', 'scrape_full_body_without_license'],
      dataRedistributionPolicy: 'TRANSFORMED_ONLY',
      dataRetentionPolicy: {
        maxStorageDays: 7,
        allowPermanentStorage: false,
        deletionOnRevocationRequired: false,
      },
      cachingPolicy: {
        allowed: true,
        maxTtlSeconds: 1800,
        prohibitedDataTypes: ['raw_full_article_body'],
        allowPersistentStorage: false,
      },
      attributionRequirements: {
        required: true,
        displayText: 'News data sourced from GNews',
        linkUrl: 'https://gnews.io',
        placement: 'inline',
      },
      oauthRequirements: { required: false },
      geographicRestrictions: [],
      clientEligibility: 'all',
      requiredApprovals: [],
      lastReviewedDate: '2026-11-18',
    });
  }

  static register(config: ProviderComplianceConfig): void {
    this.registry.set(config.providerName, config);
  }

  static getConfig(providerName: string): ProviderComplianceConfig | undefined {
    const direct = this.registry.get(providerName);
    if (direct) return direct;
    const normalized = providerName.toLowerCase().replace(/[-_]/g, '');
    for (const [key, val] of this.registry.entries()) {
      if (key.toLowerCase().replace(/[-_]/g, '') === normalized) {
        return val;
      }
    }
    return undefined;
  }

  static getAll(): ProviderComplianceConfig[] {
    return Array.from(this.registry.values());
  }

  static getAttribution(providerName: string): AttributionRequirement | undefined {
    return this.getConfig(providerName)?.attributionRequirements;
  }
}
