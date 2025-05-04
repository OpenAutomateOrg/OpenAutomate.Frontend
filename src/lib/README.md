# OpenAutomate Frontend Library

This directory contains shared utilities, services, and helpers used throughout the application.

## Directory Structure

```
lib/
├── api/            # API services and client
│   ├── auth.ts     # Authentication API
│   ├── client.ts   # API client configuration
│   └── ...         # Other API services
├── auth/           # Authentication utilities
│   ├── token-storage.ts  # Token management
│   └── ...
├── utils/          # Utility functions
└── ...
```

## Best Practices

### API Services

- API services should be placed in the `api/` directory
- Each service should export a named object (e.g., `authApi`)
- Services should be organized by domain
- Use TypeScript interfaces for request/response types

Example:

```typescript
import { api } from './client'
import type { SomeType } from '@/types/some-type'

export const someApi = {
  getSomething: async (): Promise<SomeType> => {
    const response = await api.get<SomeType>('api/some-endpoint')
    return response
  },
  
  createSomething: async (data: SomeCreateType): Promise<SomeType> => {
    const response = await api.post<SomeType>('api/some-endpoint', data)
    return response
  }
}
```

### Auth Utilities

- Authentication utilities should be placed in the `auth/` directory
- Token management should be handled in `token-storage.ts`
- Authentication context should be implemented in `providers/auth-provider.tsx`
- Use the `useAuth` hook from `hooks/use-auth.ts` for accessing auth context

### React Hooks

- Custom hooks should be placed in the `hooks/` directory
- Hook filenames should use kebab-case and start with `use-`
- Each hook should have a single responsibility
- Hooks should be well-documented with JSDoc comments

## Pattern for New Functionality

1. Define types in `types/` directory
2. Implement API service in `lib/api/`
3. Create custom hooks in `hooks/` if needed
4. Use the API service and hooks in components

## Migration Note

We're migrating away from the older `services/` pattern to this more organized structure.
When working with existing code, please:

1. Move any service in `services/` to the appropriate location in `lib/api/`
2. Update imports across the codebase
3. Add deprecation notices to old files until they can be safely removed 