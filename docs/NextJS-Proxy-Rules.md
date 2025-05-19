# Next.js Proxy Rules and Environment Variables

This document outlines how proxy rules and environment variables are configured in the OpenAutomate Frontend application.

## Environment Variables

The application uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL of the backend API server | `http://localhost:5252` |
| `NEXT_PUBLIC_APP_URL` | URL of the frontend application | `http://localhost:3000` |

## Proxy Rules in Next.js

The Next.js configuration (in `next.config.ts`) includes rewrites to proxy requests to the backend API server. This enables the frontend to act as a gateway for all API and SignalR connections.

```typescript
// Get the API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5252'

const nextConfig: NextConfig = {
  // ...
  
  async rewrites() {
    return [
      // Rewrite SignalR hub connections for bot agents
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
      }
    ]
  },
}
```

## How it Works

1. When a request is made to the frontend URL with a path matching one of the `source` patterns, Next.js will proxy the request to the corresponding `destination` URL.

2. For example, a request to `https://example.com/tenant1/api/users` will be proxied to `${API_URL}/tenant1/api/users`.

3. This allows all API and SignalR traffic to flow through the frontend, which simplifies deployment and eliminates CORS issues.

## Deployment Configuration

### Local Development

For local development, the default values will point to the local development servers:

```
NEXT_PUBLIC_API_URL=http://localhost:5252
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production Deployment

For production, you should set these environment variables appropriately:

```
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_URL=https://example.com
```

## Adding New Proxy Rules

If you need to add new proxy rules:

1. Identify the new path pattern that needs to be proxied
2. Add a new rewrite rule in `next.config.ts`
3. Ensure the API server has the corresponding endpoint

Example for adding a new proxy rule for file uploads:

```typescript
{
  source: '/:tenantSlug/upload/:path*',
  destination: `${API_URL}/:tenantSlug/upload/:path*`,
}
```

## Troubleshooting

- **404 Not Found**: Verify that the rewrite rule pattern matches your request path
- **Connection Issues**: Ensure the API server is running and accessible
- **WebSocket Errors**: Ensure your hosting provider supports WebSockets for SignalR connections 