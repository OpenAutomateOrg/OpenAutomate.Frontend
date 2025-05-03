import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* Orchestrator Application Configuration */
  
  // Disable dev indicators in development
  devIndicators: false,
  
  // Configure redirects from home to organization selector
  async redirects() {
    return [
      {
        source: '/',
        destination: '/organization-selector',
        permanent: true,
      },
    ]
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
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ]
      }
    ]
  },
  
  // Image optimization configuration
  images: {
    domains: ['assets.openautomate.me']
  },
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
}

export default nextConfig
