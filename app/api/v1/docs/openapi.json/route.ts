import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'MORX Unified API Gateway',
      version: '1.0.0',
      description:
        'Unified API Gateway & Provider Intelligence Platform for Morx. One Gateway. Multiple Services. Multiple Providers. One Normalized Response.',
      contact: {
        name: 'Morx Engineering Team',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Current Environment API Gateway',
      },
    ],
    security: [
      {
        BearerAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
          description: 'Provide your Morx Client API key (e.g., Bearer morx_live_...)',
        },
      },
      schemas: {
        UnifiedEnvelope: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            service: { type: 'string' },
            data: { type: 'object', nullable: true },
            meta: {
              type: 'object',
              properties: {
                provider: { type: 'string' },
                providers_used: { type: 'array', items: { type: 'string' } },
                cached: { type: 'boolean' },
                request_id: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                latency_ms: { type: 'number' },
                total_returned: { type: 'number' },
                next_page: { type: 'string', nullable: true },
              },
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  provider: { type: 'string' },
                  retryable: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    paths: {
      '/videos/search': {
        get: {
          summary: 'Unified Video Search',
          description: 'Search videos across YouTube and supported video providers with normalized metadata.',
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'page', in: 'query', schema: { type: 'string' } },
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['relevance', 'date', 'rating', 'viewCount'] } },
            { name: 'published_after', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'duration', in: 'query', schema: { type: 'string', enum: ['any', 'short', 'medium', 'long'] } },
            { name: 'providers', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Successful search results', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnifiedEnvelope' } } } },
          },
        },
      },
      '/weather/current': {
        get: {
          summary: 'Current Weather',
          description: 'Fetch real-time weather conditions normalized from OpenWeather.',
          parameters: [
            { name: 'lat', in: 'query', schema: { type: 'number' } },
            { name: 'lon', in: 'query', schema: { type: 'number' } },
            { name: 'city', in: 'query', schema: { type: 'string' } },
            { name: 'unit', in: 'query', schema: { type: 'string', enum: ['celsius', 'fahrenheit', 'kelvin'], default: 'celsius' } },
          ],
          responses: {
            '200': { description: 'Current weather details', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnifiedEnvelope' } } } },
          },
        },
      },
      '/weather/forecast': {
        get: {
          summary: 'Weather Forecast',
          description: 'Fetch multi-day weather forecast.',
          parameters: [
            { name: 'lat', in: 'query', schema: { type: 'number' } },
            { name: 'lon', in: 'query', schema: { type: 'number' } },
            { name: 'city', in: 'query', schema: { type: 'string' } },
            { name: 'unit', in: 'query', schema: { type: 'string', default: 'celsius' } },
          ],
          responses: {
            '200': { description: 'Forecast details', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnifiedEnvelope' } } } },
          },
        },
      },
      '/weather/air-quality': {
        get: {
          summary: 'Air Quality Pollution Index',
          parameters: [
            { name: 'lat', in: 'query', required: true, schema: { type: 'number' } },
            { name: 'lon', in: 'query', required: true, schema: { type: 'number' } },
          ],
          responses: {
            '200': { description: 'Air quality measurements', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnifiedEnvelope' } } } },
          },
        },
      },
      '/maps/geocode': {
        get: {
          summary: 'Address Geocoding',
          parameters: [{ name: 'address', in: 'query', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Geocoded coordinates', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnifiedEnvelope' } } } },
          },
        },
      },
      '/maps/reverse-geocode': {
        get: {
          summary: 'Reverse Geocoding',
          parameters: [
            { name: 'lat', in: 'query', required: true, schema: { type: 'number' } },
            { name: 'lon', in: 'query', required: true, schema: { type: 'number' } },
          ],
          responses: {
            '200': { description: 'Address matching coordinates', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnifiedEnvelope' } } } },
          },
        },
      },
      '/maps/places': {
        get: {
          summary: 'Places Discovery',
          parameters: [
            { name: 'query', in: 'query', schema: { type: 'string' } },
            { name: 'lat', in: 'query', schema: { type: 'number' } },
            { name: 'lon', in: 'query', schema: { type: 'number' } },
            { name: 'radius', in: 'query', schema: { type: 'integer' } },
          ],
          responses: {
            '200': { description: 'Discovered places', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnifiedEnvelope' } } } },
          },
        },
      },
      '/maps/directions': {
        get: {
          summary: 'Turn-by-turn Navigation Directions',
          parameters: [
            { name: 'origin', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'destination', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'mode', in: 'query', schema: { type: 'string', default: 'driving' } },
          ],
          responses: {
            '200': { description: 'Route navigation steps and metrics', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnifiedEnvelope' } } } },
          },
        },
      },
      '/maps/distance-matrix': {
        get: {
          summary: 'Distance Matrix Calculation',
          parameters: [
            { name: 'origins', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'destinations', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Matrix of distances and durations', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnifiedEnvelope' } } } },
          },
        },
      },
      '/routes/optimize': {
        post: {
          summary: 'Intelligent Multi-Stop Route Optimization',
          description: 'Solves optimal stop ordering using Google Routes Waypoint Optimization or internal 2-opt TSP heuristic.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['origin', 'stops'],
                  properties: {
                    origin: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' } } },
                    stops: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: { id: { type: 'string' }, lat: { type: 'number' }, lon: { type: 'number' } },
                      },
                    },
                    destination: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' } } },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Optimized stop sequence and legs', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnifiedEnvelope' } } } },
          },
        },
      },
      '/tiktok/user': {
        get: {
          summary: 'TikTok Creator Profile',
          responses: { '200': { description: 'TikTok creator profile' } },
        },
      },
      '/tiktok/videos': {
        get: {
          summary: 'TikTok Creator Videos',
          responses: { '200': { description: 'Recent creator videos' } },
        },
      },
      '/instagram/profile': {
        get: {
          summary: 'Instagram Business / Creator Profile',
          responses: { '200': { description: 'Instagram account info' } },
        },
      },
      '/instagram/media': {
        get: {
          summary: 'Instagram Media Feed',
          responses: { '200': { description: 'Authorized Instagram media' } },
        },
      },
    },
  };

  return NextResponse.json(spec);
}

