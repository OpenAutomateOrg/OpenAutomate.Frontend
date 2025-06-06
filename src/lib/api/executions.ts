import { api } from './client'

export interface TriggerExecutionDto {
  botAgentId: string
  packageId: string
  packageName: string
  version: string
}

export interface ExecutionResponseDto {
  id: string
  botAgentId: string
  packageId: string
  status: string
  startTime: string
  endTime?: string
  errorMessage?: string
  logOutput?: string
  botAgentName?: string
  packageName?: string
  packageVersion?: string
}

export interface UpdateExecutionStatusDto {
  status: string
  errorMessage?: string
  logOutput?: string
}

// Get the current tenant from the URL path
const getCurrentTenant = (): string => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.split('/')
    // URL format: /[tenant]/...
    if (path.length > 1 && path[1]) {
      return path[1]
    }
  }
  return 'default' // Fallback to a default tenant
}

/**
 * Trigger a new execution
 */
export const triggerExecution = async (data: TriggerExecutionDto): Promise<ExecutionResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.post<ExecutionResponseDto, TriggerExecutionDto>(
    `${tenant}/api/executions/trigger`,
    data
  )
  return response
}

/**
 * Get all executions for the current tenant using OData
 */
export const getAllExecutions = async (): Promise<ExecutionResponseDto[]> => {
  const tenant = getCurrentTenant()
  const response = await api.get<ExecutionResponseDto[]>(`${tenant}/odata/Executions`)
  return response
}

/**
 * Get execution by ID using OData
 */
export const getExecutionById = async (id: string): Promise<ExecutionResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.get<ExecutionResponseDto>(`${tenant}/odata/Executions(${id})`)
  return response
}

/**
 * Update execution status
 */
export const updateExecutionStatus = async (
  id: string,
  data: UpdateExecutionStatusDto
): Promise<ExecutionResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.put<ExecutionResponseDto, UpdateExecutionStatusDto>(
    `${tenant}/api/executions/${id}/status`,
    data
  )
  return response
}

/**
 * Cancel an execution
 */
export const cancelExecution = async (id: string): Promise<ExecutionResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.post<ExecutionResponseDto>(`${tenant}/api/executions/${id}/cancel`)
  return response
} 