import { api } from './client'
import { useParams } from 'next/navigation'

// Agent types matching the backend DTOs
export interface CreateAgentRequest {
  name: string
  machineName: string
}

export interface AgentResponse {
  id: string
  name: string
  machineName: string
  machineKey?: string  // Only present during creation or regeneration
  status: string
  lastConnected?: Date
  isActive: boolean
}

/**
 * Enumeration of possible API error types
 */
export enum AgentApiErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  NOT_FOUND = 'not_found',
  VALIDATION = 'validation',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

/**
 * Structured error for agent API operations
 */
export class AgentApiError extends Error {
  constructor(
    public readonly type: AgentApiErrorType,
    public readonly status: number,
    message: string,
    public readonly details?: string
  ) {
    super(message)
    this.name = 'AgentApiError'
  }
}

/**
 * Gets the current tenant from the URL parameters
 * Used for constructing API endpoints
 */
function getCurrentTenant(): string {
  if (typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/')
    // The tenant should be the first segment after the base URL
    if (pathParts.length > 1) {
      return pathParts[1]
    }
  }
  return 'default' // Fallback tenant
}

/**
 * Gets the API endpoint with the current tenant
 * @param path The API path without the tenant
 * @returns The full API endpoint with tenant
 */
function getTenantEndpoint(path: string): string {
  const tenant = getCurrentTenant()
  return `${tenant}/${path}`
}

// API endpoints for Bot Agent operations - matching the backend controller routes
const endpoints = {
  base: 'api/agents',
  create: 'api/agents/create',
  getById: (id: string) => `api/agents/${id}`,
  regenerateKey: (id: string) => `api/agents/${id}/regenerateKey`,
  deactivate: (id: string) => `api/agents/${id}/deactivate`
}

/**
 * Maps error status to specific error types
 */
function mapErrorType(status: number, message: string): AgentApiErrorType {
  if (status === 0) return AgentApiErrorType.NETWORK
  if (status === 401 || status === 403) return AgentApiErrorType.AUTHENTICATION
  if (status === 404) return AgentApiErrorType.NOT_FOUND
  if (status === 400 || status === 422) return AgentApiErrorType.VALIDATION
  if (status >= 500) return AgentApiErrorType.SERVER
  return AgentApiErrorType.UNKNOWN
}

/**
 * Handles API operation errors and transforms them into structured errors
 */
function handleApiError(error: any): never {
  console.error('API Error:', error)
  
  // Handle different error object structures
  let status = 0;
  let message = 'An unknown error occurred';
  let details;
  
  // If error is already an AgentApiError, just rethrow it
  if (error instanceof AgentApiError) {
    throw error;
  }
  
  // Handle structured API errors from fetchApi
  if (error && typeof error === 'object') {
    status = error.status || 0;
    message = error.message || 'An unknown error occurred';
    details = error.details;
  }
  
  // Map the error type based on status code
  const type = mapErrorType(status, message);
  
  // Create and throw a structured error
  throw new AgentApiError(type, status, message, details);
}

/**
 * Bot Agent API service
 * Handles all agent-related API calls with proper error handling
 */
export const agentApi = {
  /**
   * Get all agents
   * @returns List of all agents
   */
  getAll: async (): Promise<AgentResponse[]> => {
    try {
      return await api.get<AgentResponse[]>(getTenantEndpoint(endpoints.base))
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Get an agent by ID
   * @param id Agent ID
   * @returns Agent details
   */
  getById: async (id: string): Promise<AgentResponse> => {
    try {
      return await api.get<AgentResponse>(
        getTenantEndpoint(endpoints.getById(id))
      )
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Create a new agent
   * @param data Agent creation data
   * @returns Created agent with machine key
   */
  create: async (data: CreateAgentRequest): Promise<AgentResponse> => {
    try {
      return await api.post<AgentResponse, CreateAgentRequest>(
        getTenantEndpoint(endpoints.create),
        data
      )
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Regenerate the machine key for an agent
   * @param id Agent ID
   * @returns Updated agent with new machine key
   */
  regenerateKey: async (id: string): Promise<AgentResponse> => {
    try {
      return await api.post<AgentResponse>(
        getTenantEndpoint(endpoints.regenerateKey(id))
      )
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Deactivate an agent
   * @param id Agent ID
   */
  deactivate: async (id: string): Promise<void> => {
    try {
      await api.post<void>(
        getTenantEndpoint(endpoints.deactivate(id))
      )
    } catch (error) {
      return handleApiError(error)
    }
  }
}

/**
 * React hook to use the agent API with the current tenant from the route
 * @returns Agent API methods with tenant context from the route
 */
export function useAgentApi() {
  const params = useParams<{ tenant: string }>()
  
  /**
   * Gets the tenant-specific endpoint from the route params
   */
  const getTenantSpecificEndpoint = (path: string): string => {
    // Get tenant from params or fallback to default
    let tenant = 'default'
    
    if (params && params.tenant) {
      tenant = String(params.tenant) // Ensure it's a string
    } else if (typeof window !== 'undefined') {
      // Try to extract from URL as fallback
      const pathParts = window.location.pathname.split('/')
      if (pathParts.length > 1 && pathParts[1]) {
        tenant = pathParts[1]
      }
    }
    
    return `${tenant}/${path}`
  }
  
  return {
    /**
     * Get all agents for the current tenant
     */
    getAll: async (): Promise<AgentResponse[]> => {
      try {
        return await api.get<AgentResponse[]>(
          getTenantSpecificEndpoint(endpoints.base)
        )
      } catch (error) {
        return handleApiError(error)
      }
    },
    
    /**
     * Get an agent by ID for the current tenant
     */
    getById: async (id: string): Promise<AgentResponse> => {
      try {
        return await api.get<AgentResponse>(
          getTenantSpecificEndpoint(endpoints.getById(id))
        )
      } catch (error) {
        return handleApiError(error)
      }
    },
    
    /**
     * Create a new agent for the current tenant
     */
    create: async (data: CreateAgentRequest): Promise<AgentResponse> => {
      try {
        return await api.post<AgentResponse, CreateAgentRequest>(
          getTenantSpecificEndpoint(endpoints.create),
          data
        )
      } catch (error) {
        return handleApiError(error)
      }
    },
    
    /**
     * Regenerate the machine key for an agent in the current tenant
     */
    regenerateKey: async (id: string): Promise<AgentResponse> => {
      try {
        return await api.post<AgentResponse>(
          getTenantSpecificEndpoint(endpoints.regenerateKey(id))
        )
      } catch (error) {
        return handleApiError(error)
      }
    },
    
    /**
     * Deactivate an agent in the current tenant
     */
    deactivate: async (id: string): Promise<void> => {
      try {
        await api.post<void>(
          getTenantSpecificEndpoint(endpoints.deactivate(id))
        )
      } catch (error) {
        return handleApiError(error)
      }
    }
  }
} 