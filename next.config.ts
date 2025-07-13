import type { NextConfig } from 'next'

// Frontend now makes direct API calls to NEXT_PUBLIC_API_URL
// No proxy configuration needed for production scalability

const nextConfig: NextConfig = {
  /* Public Website Configuration */

  // Disable dev indicators in development
  devIndicators: false,

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
      // REMOVED: Proxy-specific headers no longer needed
      // Bot agents now connect directly to backend SignalR hubs
    ]
  },

  // Image optimization configuration
  images: {
    domains: ['assets.openautomate.me'],
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // REMOVED: API and SignalR proxy rewrites for production scalability
  // Frontend now makes direct calls to backend API
  // Bot agents connect directly to backend SignalR hubs
  // This eliminates the frontend as a proxy bottleneck
}

export default nextConfig
