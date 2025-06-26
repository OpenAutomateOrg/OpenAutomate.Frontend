import { SWRConfiguration } from 'swr'
import { fetchApi } from './api/client'

/**
 * Centralized SWR configuration for the application
 * Provides consistent fetching, caching, and error handling
 */
export const swrConfig: SWRConfiguration = {
  // Use our existing fetchApi function as the default fetcher
  fetcher: (url: string) => fetchApi(url),

  // Revalidation settings
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,

  // Error handling
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  shouldRetryOnError: (error) => {
    // Don't retry on 4xx errors (client errors)
    if (error?.status >= 400 && error?.status < 500) {
      return false
    }
    return true
  },

  // Performance settings
  dedupingInterval: 2000, // Dedupe requests within 2 seconds
  focusThrottleInterval: 5000, // Throttle focus revalidation
}

/**
 * Centralized cache key generators for consistent caching
 * This ensures all components use the same cache keys for the same data
 */
export const swrKeys = {
  // Executions
  executions: () => ['executions'] as const,
  executionsWithOData: (params: Record<string, unknown>) => ['executions', 'odata', params],
  executionById: (id: string) => ['executions', id] as const,

  // Roles/Authorities
  roles: () => ['roles'] as const,
  roleById: (id: string) => ['roles', id] as const,
  availableResources: () => ['available-resources'] as const,

  // Agents
  agents: () => ['agents'] as const,
  agentsWithOData: (options?: Record<string, unknown>) => ['agents', 'odata', options] as const,
  agentById: (id: string) => ['agents', id] as const,

  // Packages
  packages: () => ['packages'] as const,
  packagesWithOData: (options?: Record<string, unknown>) => ['packages', 'odata', options] as const,
  packageById: (id: string) => ['packages', id] as const,
  packageVersions: (id: string) => ['packages', id, 'versions'] as const,

  // Organization Units
  organizationUnits: () => ['organization-units'] as const,

  // Assets
  assets: () => ['assets'] as const,
  assetsWithOData: (options?: Record<string, unknown>) => ['assets', 'odata', options] as const,
  assetById: (id: string) => ['assets', id] as const,
  assetAgents: (id: string) => ['assets', id, 'agents'] as const,

  // System Roles
  systemRoles: (role?: string) =>
    role ? (['system-roles', role] as const) : (['system-roles'] as const),
  adminUsers: () => ['system-roles', 'admin'] as const,
  standardUsers: () => ['system-roles', 'user'] as const,
  usersByRole: (role: string) => ['system-roles', 'users', role] as const,

  // Schedules
  schedules: () => ['schedules'] as const,
  schedulesWithOData: (options?: Record<string, unknown>) =>
    ['schedules', 'odata', options] as const,
  scheduleById: (id: string) => ['schedules', id] as const,
}

/**
 * Helper function to create error messages for SWR errors
 */
export const createSWRErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'status' in error) {
    const statusError = error as { status: number }
    if (statusError.status === 401) {
      return 'Authentication required. Please log in again.'
    }
    if (statusError.status === 403) {
      return 'You do not have permission to access this resource.'
    }
    if (statusError.status === 404) {
      return 'The requested resource was not found.'
    }
    if (statusError.status >= 500) {
      return 'Server error. Please try again later.'
    }
  }
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }
  return 'An unexpected error occurred. Please try again.'
}
