# OpenAutomate Cloud Orchestrator

[![Quality Gate Status](http://sonar.openautomate.me/api/project_badges/measure?project=openautomate-frontend&metric=alert_status&token=sqb_385511a0b7550c1ba5639883e04e3910615d17f4)](http://sonar.openautomate.me/dashboard?id=openautomate-frontend)

This is the **Cloud Orchestrator** application for OpenAutomate - an open-source business process automation management platform. This repository contains the tenant-specific Next.js application that provides authenticated access to manage automation processes, bot agents, packages, and executions.

## Frontend Architecture

OpenAutomate uses a split frontend architecture consisting of two separate applications:

1. **Public Website (openautomate.me)**

   - Marketing content, documentation, landing pages
   - Public information, pricing, features
   - Simple "Launch Orchestrator" button redirecting to this app

2. **Cloud Orchestrator (cloud.openautomate.me - this repository)**
   - Tenant-specific application (similar to UiPath Orchestrator)
   - Multi-tenant implementation with organization-based routing
   - Authentication, authorization, and tenant context management
   - All tenant-specific functionality (automations, bot agents, schedules, etc.)

This separation provides clear division of concerns, improved security, and independent scaling for each application.

## Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) - Customizable component system
- **Authentication**: JWT with HTTP-only cookies for refresh tokens
- **State Management**: React Context API with custom providers
- **API Client**: Custom fetch-based client with authentication handling

## Architecture

The application follows these architectural patterns:

- **Provider Architecture**: Context providers for authentication and tenant state
- **SSR & Client Hybrid**: Server components for data fetching, client components for interactivity
- **Multi-Tenant Design**: Path-based tenant routing (/{tenant}/dashboard)
- **Memory-First Token Storage**: Secure token handling with session fallback
- **Component-Driven Design**: Reusable, modular UI components following consistent patterns

## UI Design System

The application implements a clean, professional UI:

- **Design Principles**:
  - Clean, minimalist aesthetic suitable for enterprise software
  - Consistent spacing and sizing
  - Accessible to meet WCAG standards
  - Support for both light and dark modes
- **Component Patterns**:
  - Form components with consistent validation
  - Card-based layouts for information grouping
  - Consistent button hierarchy with enhanced hover effects
  - Table components for data presentation
- **Animation Effects**:
  - Button hover animations (scale, shadow, and y-axis translation)
  - Smooth transitions between states
  - Loading spinners for asynchronous operations
- **Page Layouts**:
  - Dashboard with content sections and card grids
  - Authentication pages with centered forms and clear pathways
  - Tenant-specific views for organization data

## Project Structure

```
openautomate-frontend/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (auth)/               # Authentication pages (login, register)
│   │   ├── (tenant)/[tenant]/    # Tenant-specific pages
│   │   └── layout.tsx            # Root layout with providers
│   ├── components/               # Reusable components
│   │   ├── auth/                 # Authentication components
│   │   ├── forms/                # Form components for different features
│   │   ├── layout/               # Layout components (Header, Footer, etc.)
│   │   ├── providers/            # Context providers
│   │   └── ui/                   # UI components (buttons, cards, etc.)
│   ├── lib/                      # Utilities and services
│   │   ├── api/                  # API client and utilities
│   │   ├── hooks/                # Custom React hooks
│   │   └── config.ts             # Application configuration
│   ├── types/                    # TypeScript type definitions
│   └── styles/                   # Global styles
├── public/                       # Static assets
├── .env.local.example            # Example environment variables
└── next.config.js                # Next.js configuration
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18.0.0 or later
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [OpenAutomate Backend API](https://github.com/yourusername/openautomate-backend) running locally or at a configured URL

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/openautomate-frontend.git
cd openautomate-frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file based on `.env.local.example`:

```bash
cp .env.local.example .env.local
```

4. Update the environment variables in `.env.local`:

```
NEXT_PUBLIC_API_URL=https://localhost:7240
NEXT_PUBLIC_WEBSITE_URL=http://localhost:3000
```

### Running the Application

Start the development server:

```bash
npm run dev -- --port 3001
# or
yarn dev --port 3001
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the application.

> **Note:** The public website typically runs on port 3000, while this orchestrator application runs on port 3001 to allow both to run simultaneously during development.

## Troubleshooting

### Redirect Loop Issues

If you experience redirect loops between the public website and orchestrator:

1. Clear browser cookies for both domains
2. Check that your next.config.ts doesn't contain redirects from / to /tenant-selector
3. Ensure both applications have correct environment variables pointing to each other
4. Try using incognito/private browsing mode to test without existing cookies
5. Check for authentication-related code in shared components

### Development with Split Architecture

When developing locally with both applications:

```bash
# Terminal 1 - Public Website
cd OpenAutomate.PublicSite
npm run dev -- --port 3000

# Terminal 2 - Cloud Orchestrator
cd OpenAutomate.Frontend
npm run dev -- --port 3001
```

## Development Guidelines

### Authentication & Tenant Context

The application uses provider components for authentication and tenant context:

```tsx
// Using authentication
'use client'

import { useAuth } from '@/lib/hooks/use-auth'

export function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth()

  // Component code
}

// Using tenant context
;('use client')

import { useTenant } from '@/components/providers/TenantProvider'

export function MyComponent() {
  const { currentTenant } = useTenant()

  // Component code
}
```

### UI Component Usage

The application uses shadcn/ui components with our custom styling:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export function MyFeatureCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Name</CardTitle>
        <CardDescription>Feature description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Feature content</p>
        <Button
          className="transition-all duration-300 hover:translate-y-[-2px]"
          onClick={() => console.log('Button clicked')}
        >
          Action
        </Button>
      </CardContent>
    </Card>
  )
}
```

### Server-Side Rendering

For components that need browser APIs but also work with SSR:

```tsx
'use client'

import { useState, useEffect } from 'react'

export function MyComponent() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use the same loading state for both server and client
  if (!mounted) {
    return <div>Loading...</div>
  }

  // Client-side only content
  return <div>Client content</div>
}
```

### API Integration

Use the API client for making requests to the backend:

```tsx
import { apiClient } from '@/lib/api/client'
import { useTenant } from '@/components/providers/TenantProvider'

export function MyComponent() {
  const { currentTenant } = useTenant()

  const fetchData = async () => {
    try {
      const response = await apiClient.get('/my-endpoint', {
        tenant: currentTenant,
      })
      // Handle response
    } catch (error) {
      // Handle error
    }
  }

  // Component code
}
```

## Available Scripts

- `npm run dev -- --port 3001` - Start the development server on port 3001
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check for code quality issues
- `npm run test` - Run unit tests
- `npm run typecheck` - Check TypeScript types

## Environment Variables

| Variable                  | Description               | Default                  |
| ------------------------- | ------------------------- | ------------------------ |
| `NEXT_PUBLIC_API_URL`     | URL of the backend API    | `https://localhost:7240` |
| `NEXT_PUBLIC_WEBSITE_URL` | URL of the public website | `http://localhost:3000`  |

## Deployment

### Production Build

```bash
npm run build
npm run start
```

### Vercel Deployment

The easiest way to deploy the application is with [Vercel](https://vercel.com/):

1. Push your code to a GitHub repository
2. Import the project into Vercel
3. Configure the environment variables
4. Deploy

## Contributing

1. Create a new branch for your feature
2. Implement the feature with appropriate tests
3. Run all tests to ensure they pass
4. Create a pull request with a detailed description
5. Request a code review

## License

[MIT](LICENSE)

## Related Projects

- [OpenAutomate Backend](https://github.com/yourusername/openautomate-backend) - The backend API
- [OpenAutomate Public Website](https://github.com/yourusername/openautomate-public-site) - The public marketing website
