import type { NextConfig } from 'next'

// Get the API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5252'

const nextConfig: NextConfig = {
  /* Public Website Configuration */

  // Disable dev indicators in development
  devIndicators: false,

  // Disable TypeScript errors during build (make it like development)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Disable ESLint errors during build  
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Webpack configuration for memory optimization
  webpack: (config, { dev, isServer }) => {
    // Memory optimization for development
    if (dev) {
      // Limit memory usage for webpack cache
      config.cache = {
        type: 'memory',
        maxGenerations: 1,
      }

      // Optimize chunk splitting to reduce memory usage
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
          },
        },
      }
    }

    return config
  },

  // Experimental features for better memory management
  experimental: {
    // Reduce memory usage during development
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Enable webpack build worker for better memory management
    webpackBuildWorker: true,
  },

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
      // Add headers for machine key preservation
      {
        source: '/:tenantSlug/hubs/:path*',
        has: [
          {
            type: 'query',
            key: 'machineKey',
          },
        ],
        headers: [
          {
            key: 'X-Machine-Key-Auth',
            value: 'true',
          },
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
      // Standard WebSocket headers for other connections
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
      {
        source: '/:tenantSlug/hubs/:path*/negotiate',
        destination: `${API_URL}/:tenantSlug/hubs/:path*/negotiate`,
        has: [
          {
            type: 'query',
            key: 'machineKey',
          },
        ],
      },

      // Second rule - machine key negotiation with param forwarded for SignalR
      {
        source: '/:tenantSlug/hubs/:path*/negotiate',
        destination: `${API_URL}/:tenantSlug/hubs/:path*/negotiate`,
      },

      // Third rule - direct agent connections (all hub connections with machineKey parameter)
      {
        source: '/:tenantSlug/hubs/:path*',
        destination: `${API_URL}/:tenantSlug/hubs/:path*`,
        has: [
          {
            type: 'query',
            key: 'machineKey',
          },
        ],
      },

      // Fourth rule - standard hub connections (without machineKey)
      {
        source: '/:tenantSlug/hubs/:path*',
        destination: `${API_URL}/:tenantSlug/hubs/:path*`,
      },

      // Rewrite regular API calls
      {
        source: '/:tenantSlug/api/:path*',
        destination: `${API_URL}/:tenantSlug/api/:path*`,
      },
    ]
  },
}

export default nextConfig
