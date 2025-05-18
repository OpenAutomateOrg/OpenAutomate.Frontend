# Reverse Proxy SignalR Implementation

This document describes how the bot agent connection is implemented in the OpenAutomate platform using Next.js rewrites and SignalR.

## Overview

The implementation allows bot agents to connect to the frontend URL while the actual SignalR hub is hosted on the backend server. This simplifies deployment and eliminates CORS issues, as all traffic is proxied through the Next.js application.

## Implementation Details

### 1. Next.js Configuration (next.config.ts)

We use Next.js rewrites to proxy API and SignalR connections:

```typescript
// Get the API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5252'

const nextConfig: NextConfig = {
  // ... other config

  // Configure API and SignalR proxy rewrites
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

### 2. Agent Connection UI

In the agent detail page, we provide the frontend URL for the agent to connect to:

```typescript
// Frontend URL for agent connection
const frontendUrl = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.host}`
  : config.app.url

// ... 

// Connection URL section
<div className="bg-muted p-4 rounded-md">
  <div className="flex justify-between items-center mb-2">
    <span className="text-sm font-medium">Connection URL</span>
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => handleCopy(`${frontendUrl}/${tenant}/hubs/botagent`, 'Connection URL')}
    >
      <Copy className="h-4 w-4 mr-1" /> Copy
    </Button>
  </div>
  <div className="bg-card p-2 rounded border text-sm font-mono overflow-x-auto">
    {`${frontendUrl}/${tenant}/hubs/botagent`}
  </div>
  <p className="text-sm text-muted-foreground mt-2">
    Use this URL to connect your bot agent to the OpenAutomate platform.
  </p>
</div>
```

### 3. Configuration Example

The agent detail page also includes a configuration example for the bot agent:

```typescript
<div className="bg-muted p-4 rounded-md">
  <span className="text-sm font-medium block mb-2">Configuration Example</span>
  <div className="bg-card p-3 rounded border text-sm font-mono overflow-x-auto">
    {`{
  "ServerUrl": "${frontendUrl}/${tenant}",
  "MachineKey": "${agent.machineKey || '[your-machine-key]'}",
  "AutoStart": true,
  "LogLevel": "Information"
}`}
  </div>
  <p className="text-sm text-muted-foreground mt-2">
    Example configuration for your bot agent. The SignalR connection will be handled through the frontend URL.
  </p>
</div>
```

## Deployment Considerations

1. **API URL Configuration**: Set the `NEXT_PUBLIC_API_URL` environment variable to point to your backend API server.

2. **Web Socket Support**: Ensure your hosting provider supports WebSockets for SignalR to function properly.

3. **Timeout Settings**: Configure appropriate timeout settings for long-running connections in your hosting environment.

4. **Load Balancing**: If using load balancing, ensure sticky sessions are enabled for SignalR connections.

## Benefits

- **Simplified Architecture**: Clients only need to connect to a single URL
- **CORS Elimination**: No cross-origin issues since all traffic flows through the Next.js app
- **Flexible Backend**: Can change the backend API URL without affecting clients
- **Enhanced Security**: API server doesn't need to be directly exposed to the internet 