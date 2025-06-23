import { api } from './client'

export interface CreateAssetDto {
  key: string
  description: string
  value: string
  type: number
  botAgentIds: string[]
}

export interface UpdateAssetDto {
  key: string
  description: string
  value: string
}

export interface AssetResponseDto {
  id: string
  key: string
  type: number
  description: string
  createdBy: string
  createdAt?: string
  updatedAt?: string
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
}

export interface BotAgentSummaryDto {
  id: string
  name: string
  machineName: string
  status: string
}

export interface AssetDetailDto {
  id: string
  key: string
  description: string
  type: number
  value?: string
  createdAt?: string
  createdById?: string
  authorizedBotAgents?: BotAgentSummaryDto[]
}

export interface Agent {
  id: string
  name: string
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
 * Build OData query string from options
 */
function buildODataQueryString(options?: ODataQueryOptions): string {
  if (!options) return ''

  const params = new URLSearchParams()

  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value))
    }
  })

  return params.toString()
}

/**
 * Create a new asset
 */
export const createAsset = async (data: CreateAssetDto): Promise<AssetResponseDto> => {
  const tenant = getCurrentTenant()
  return api.post<AssetResponseDto, CreateAssetDto>(`${tenant}/api/assets`, data)
}

/**
 * Update an asset
 */
export const updateAsset = async (
  id: string,
  data: UpdateAssetDto,
  botAgentIds: string[],
): Promise<AssetResponseDto> => {
  const tenant = getCurrentTenant()
  const assetRes = await api.put<AssetResponseDto>(`${tenant}/api/assets/${id}`, data)
  await api.put(`${tenant}/api/assets/${id}/bot-agents`, { botAgentIds })
  return assetRes
}

/**
 * Get an asset by ID
 */
export const getAssetById = async (id: string): Promise<AssetResponseDto> => {
  const tenant = getCurrentTenant()
  return api.get<AssetResponseDto>(`${tenant}/api/assets/${id}`)
}

/**
 * Get all assets (using regular API)
 */
export const getAllAssets = async (): Promise<AssetResponseDto[]> => {
  const tenant = getCurrentTenant()
  const response = await api.get<AssetResponseDto[]>(`${tenant}/api/assets`)
  return response
}

/**
 * Type guard for OData response
 */
function isODataResponse(
  obj: unknown,
): obj is { value: AssetResponseDto[]; '@odata.count'?: number } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'value' in obj &&
    Array.isArray((obj as { value?: unknown }).value)
  )
}

/**
 * Process raw response into standard OData format
 */
function processODataResponse(response: unknown): ODataResponse<AssetResponseDto> {
  // First, check if the response already has the expected OData format
  if (isODataResponse(response)) {
    // If value is an array, we have a valid response
    if (Array.isArray(response.value)) {
      console.log(
        `Received ${response.value.length} items from OData. Total count: ${response['@odata.count']}`,
      )
      return {
        value: response.value,
        '@odata.count': response['@odata.count'] ?? response.value.length,
      }
    }
  }

  // Handle the case where the API returns an array directly
  if (Array.isArray(response)) {
    console.log('Converting array response to OData format')
    return {
      value: response as AssetResponseDto[],
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
      if (arrayProp) {
        console.log(`Found array property "${arrayProp}" in response`)
        const arr = (response as Record<string, unknown[]>)[arrayProp] as AssetResponseDto[]
        const count = (response as Record<string, unknown>)['@odata.count']
        return {
          value: arr,
          '@odata.count': (typeof count === 'number' ? count : undefined) ?? arr.length,
        }
      }
    }
  }

  // Fallback to empty response
  console.warn('Could not parse OData response, returning empty result')
  return { value: [] }
}

/**
 * Get assets with OData query capabilities (filtering, sorting, pagination)
 */
export const getAssetsWithOData = async (
  options?: ODataQueryOptions,
): Promise<ODataResponse<AssetResponseDto>> => {
  const tenant = getCurrentTenant()
  const queryString = buildODataQueryString(options)
  let endpoint = `${tenant}/odata/Assets`
  if (queryString) {
    endpoint += `?${queryString}`
  }

  console.log('OData query endpoint:', endpoint)
  try {
    const response = await api.get<unknown>(endpoint)
    console.log('Raw OData response:', response)
    return processODataResponse(response)
  } catch (error) {
    console.error('Error fetching assets with OData:', error)
    // Return empty response on error
    return { value: [] }
  }
}

/**
 * Get a specific asset by ID with OData query options
 */
export const getAssetByIdWithOData = async (
  id: string,
  options?: ODataQueryOptions,
): Promise<AssetResponseDto> => {
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
  let endpoint = `${tenant}/odata/Assets(${id})`
  if (queryString) {
    endpoint += '?' + queryString
  }

  const response = await api.get<AssetResponseDto>(endpoint)
  return response
}

/**
 * Delete an asset
 */
export const deleteAsset = async (id: string): Promise<void> => {
  const tenant = getCurrentTenant()
  await api.delete<void>(`${tenant}/api/assets/${id}`)
}

/**
 * Get asset details (including associated agents)
 */
export const getAssetDetail = async (id: string): Promise<AssetDetailDto> => {
  const tenant = getCurrentTenant()
  return api.get<AssetDetailDto>(`${tenant}/api/assets/${id}`)
}

/**
 * Get the list of agents associated with the asset
 */
export const getAssetAgents = async (id: string): Promise<BotAgentSummaryDto[]> => {
  const tenant = getCurrentTenant()
  return api.get<BotAgentSummaryDto[]>(`${tenant}/api/assets/${id}/bot-agents`)
}

export const getAllAgents = async (): Promise<Agent[]> => {
  const tenant = getCurrentTenant()
  return api.get<Agent[]>(`${tenant}/api/agents`)
}
