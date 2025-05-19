import { api } from './client'

export interface CreateBotAgentDto {
  name: string
  machineName: string
}

export interface BotAgentResponseDto {
  id: string
  name: string
  machineName: string
  machineKey: string
  status: string
  lastConnected: string
  isActive: boolean
}

export interface ODataQueryOptions {
  $filter?: string
  $orderby?: string
  $top?: number
  $skip?: number
  $select?: string
  $count?: boolean
  $expand?: string
}

export interface ODataResponse<T> {
  value: T[]
  '@odata.count'?: number
  '@odata.nextLink'?: string
}

// Get the current tenant from the URL path, skipping the 'en' locale if present
const getCurrentTenant = (): string => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.split('/')
    // URL format: /[locale]/[tenant]/...
    // Example: ['', 'en', 'tenant1', ...]
    // If the first segment is a locale ('en'), skip it
    if (path.length > 2) {
      // Check if path[1] is a locale (e.g., 'en')
      const localePattern = /^[a-z]{2}$/i
      const tenantIndex = localePattern.test(path[1]) ? 2 : 1
      if (path[tenantIndex]) {
        return path[tenantIndex]
      }
    }
  }
  return 'default' // Fallback to a default tenant
}

/**
 * Create a new bot agent
 */
export const createBotAgent = async (data: CreateBotAgentDto): Promise<BotAgentResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.post<BotAgentResponseDto, CreateBotAgentDto>(
    `${tenant}/api/agents/create`,
    data,
  )
  return response
}

/**
 * Get a bot agent by ID
 */
export const getBotAgentById = async (id: string): Promise<BotAgentResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.get<BotAgentResponseDto>(`${tenant}/api/agents/${id}`)
  return response
}

/**
 * Get all bot agents (using regular API)
 */
export const getAllBotAgents = async (): Promise<BotAgentResponseDto[]> => {
  const tenant = getCurrentTenant()
  const response = await api.get<BotAgentResponseDto[]>(`${tenant}/api/agents`)
  return response
}

/**
 * Type guard for OData response
 */
function isODataResponse(
  obj: unknown,
): obj is { value: BotAgentResponseDto[]; '@odata.count'?: number } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'value' in obj &&
    Array.isArray((obj as { value?: unknown }).value)
  )
}

/**
 * Build query string from OData options
 */
function buildODataQueryString(options?: ODataQueryOptions): string {
  const queryParams = new URLSearchParams()

  // Always include count=true to get total count for pagination
  queryParams.append('$count', 'true')

  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== '$count') {
        // Skip $count as we've already added it
        queryParams.append(key, String(value))
      }
    })
  }

  return queryParams.toString()
}

/**
 * Process raw response into standard OData format
 */
function processODataResponse(response: unknown): ODataResponse<BotAgentResponseDto> {
  // First, check if the response already has the expected OData format
  if (isODataResponse(response)) {
    // If value is an array, we have a valid response
    if (Array.isArray(response.value)) {
      console.log(
        `Received ${response.value.length} items from OData. Total count: ${response['@odata.count']}`,
      )
      return {
        value: response.value,
        '@odata.count':
          response['@odata.count'] !== undefined ? response['@odata.count'] : response.value.length,
      }
    }
  }

  // Handle the case where the API returns an array directly
  if (Array.isArray(response)) {
    console.log('Converting array response to OData format')
    return {
      value: response as BotAgentResponseDto[],
      '@odata.count': response.length,
    }
  }

  // If response is an object but doesn't have a value property
  if (typeof response === 'object' && response !== null) {
    // Try to find the most likely array property
    const arrayProps = Object.keys(response).filter((key) =>
      Array.isArray((response as Record<string, unknown[]>)[key]),
    )

    if (arrayProps.length > 0) {
      const arrayProp = arrayProps[0]
      console.log(`Found array property "${arrayProp}" in response`)
      const arr = (response as Record<string, unknown[]>)[arrayProp] as BotAgentResponseDto[]
      const count = (response as Record<string, unknown>)['@odata.count']
      return {
        value: arr,
        '@odata.count': typeof count === 'number' ? count : arr.length,
      }
    }
  }

  // Fallback to empty response
  console.warn('Could not parse OData response, returning empty result')
  return { value: [] }
}

/**
 * Get bot agents with OData query capabilities (filtering, sorting, pagination)
 */
export const getBotAgentsWithOData = async (
  options?: ODataQueryOptions,
): Promise<ODataResponse<BotAgentResponseDto>> => {
  const tenant = getCurrentTenant()
  const queryString = buildODataQueryString(options)
  let endpoint = `${tenant}/odata/BotAgents`
  if (queryString) {
    endpoint += `?${queryString}`
  }

  console.log('OData query endpoint:', endpoint)
  try {
    const response = await api.get<unknown>(endpoint)
    console.log('Raw OData response:', response)
    return processODataResponse(response)
  } catch (error) {
    console.error('Error fetching agents with OData:', error)
    // Return empty response on error
    return { value: [] }
  }
}

/**
 * Get a specific bot agent by ID with OData query options
 */
export const getBotAgentByIdWithOData = async (
  id: string,
  options?: ODataQueryOptions,
): Promise<BotAgentResponseDto> => {
  const tenant = getCurrentTenant()

  // Build query string from options
  const queryParams = new URLSearchParams()

  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
  }

  const queryString = queryParams.toString()
  const endpoint = `${tenant}/odata/BotAgents(${id})${queryString ? `?${queryString}` : ''}`

  const response = await api.get<BotAgentResponseDto>(endpoint)
  return response
}

/**
 * Regenerate a bot agent's machine key
 */
export const regenerateMachineKey = async (id: string): Promise<BotAgentResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.post<BotAgentResponseDto>(`${tenant}/api/agents/${id}/regenerateKey`)
  return response
}

/**
 * Deactivate a bot agent
 */
export const deactivateBotAgent = async (id: string): Promise<void> => {
  const tenant = getCurrentTenant()
  await api.post<void>(`${tenant}/api/agents/${id}/deactivate`)
}
