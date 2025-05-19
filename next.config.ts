import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

// Get the API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5252'

const nextConfig: NextConfig = {
  /* Public Website Configuration */

  // Disable dev indicators in development
  devIndicators: false,

  // Configure headers for security
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
      // Add WebSocket specific headers
      {
        source: '/:tenantSlug/hubs/:path*',
        headers: [
          {
            key: 'Connection',
            value: 'keep-alive',
          },
          {
            key: 'Keep-Alive',
            value: 'timeout=120',
          },
          {
            key: 'Upgrade',
            value: 'websocket',
          },
        ],
      },
    ]
  },

  // Image optimization configuration
  images: {
    domains: ['assets.openautomate.me'],
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Configure API and SignalR proxy rewrites
  async rewrites() {
    return [
      // SignalR negotiation endpoint (this needs to be first)
      {
        source: '/:tenantSlug/hubs/:path*/negotiate',
        destination: `${API_URL}/:tenantSlug/hubs/:path*/negotiate`,
      },

      // SignalR hub connections - standard HTTP (including query params like ?id=xyz)
      {
        source: '/:tenantSlug/hubs/:path*',
        destination: `${API_URL}/:tenantSlug/hubs/:path*`,
      },

      // Rewrite OData API calls
      {
        source: '/:tenantSlug/odata/:path*',
        destination: `${API_URL}/:tenantSlug/odata/:path*`,
      },

      // Rewrite regular API calls
      {
        source: '/:tenantSlug/api/:path*',
        destination: `${API_URL}/:tenantSlug/api/:path*`,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
