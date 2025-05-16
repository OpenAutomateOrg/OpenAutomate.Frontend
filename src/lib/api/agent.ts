import { api } from './client'

/**
 * Agent API response type
 */
export interface AgentResponse {
  id: string
  name: string
  machineName: string
  machineKey: string
  status: string
  lastConnected: string | null
  isActive: boolean
}

/**
 * Agent creation payload
 */
export interface CreateAgentPayload {
  name: string
  machineName: string
}

/**
 * API ping response
 */
interface PingResponse {
  status: string
  version: string
  timestamp: string
}

/**
 * Get current tenant from URL
 */
const getCurrentTenant = (): string => {
  // Extract tenant from URL path or use a default
  if (typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 1 && pathParts[1]) {
      return pathParts[1];
    }
  }
  return 'default'; // Fallback tenant
};

/**
 * Agent API service
 */
export const agentApi = {
  /**
   * Test API connection
   */
  testConnection: async (): Promise<boolean> => {
    try {
      const tenant = getCurrentTenant();
      await api.get<PingResponse>(`${tenant}/api/ping`)
      return true
    } catch (error) {
      console.error('API connection test failed:', error)
      return false
    }
  },

  /**
   * Get all agents
   */
  getAll: async (): Promise<AgentResponse[]> => {
    const tenant = getCurrentTenant();
    return api.get<AgentResponse[]>(`${tenant}/api/agents`)
  },

  /**
   * Get agent by ID
   */
  getById: async (id: string): Promise<AgentResponse> => {
    const tenant = getCurrentTenant();
    return api.get<AgentResponse>(`${tenant}/api/agents/${id}`)
  },

  /**
   * Create a new agent
   */
  create: async (agent: CreateAgentPayload): Promise<AgentResponse> => {
    try {
      const tenant = getCurrentTenant();
      return await api.post<AgentResponse, CreateAgentPayload>(
        `${tenant}/api/agents/create`, 
        agent
      )
    } catch (error) {
      console.error('Create agent error details:', error)
      throw error
    }
  },

  /**
   * Regenerate agent machine key
   */
  regenerateMachineKey: async (id: string): Promise<AgentResponse> => {
    const tenant = getCurrentTenant();
    return api.post<AgentResponse>(`${tenant}/api/agents/${id}/regenerateKey`)
  },

  /**
   * Deactivate agent
   */
  deactivate: async (id: string): Promise<void> => {
    const tenant = getCurrentTenant();
    return api.post<void>(`${tenant}/api/agents/${id}/deactivate`)
  }
} 