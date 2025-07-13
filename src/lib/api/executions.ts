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
  hasLogs?: boolean
  botAgentName?: string
  packageName?: string
  packageVersion?: string
}

export interface UpdateExecutionStatusDto {
  status: string
  errorMessage?: string
  logOutput?: string
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
 * Process OData response
 */
function processODataResponse<T>(response: unknown): ODataResponse<T> {
  if (!response || typeof response !== 'object') {
    return { value: [] }
  }

  const result = response as Record<string, unknown>

  return {
    value: Array.isArray(result.value) ? (result.value as T[]) : [],
    '@odata.count': typeof result['@odata.count'] === 'number' ? result['@odata.count'] : undefined,
    '@odata.nextLink':
      typeof result['@odata.nextLink'] === 'string' ? result['@odata.nextLink'] : undefined,
  }
}

/**
 * Trigger a new execution
 */
export const triggerExecution = async (
  data: TriggerExecutionDto,
): Promise<ExecutionResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.post<ExecutionResponseDto, TriggerExecutionDto>(
    `${tenant}/api/executions/trigger`,
    data,
  )
  return response
}

/**
 * Get all executions for the current tenant
 */
export const getAllExecutions = async (): Promise<ExecutionResponseDto[]> => {
  const tenant = getCurrentTenant()
  try {
    const response = await api.get<ExecutionResponseDto[]>(`${tenant}/api/executions`)
    return response
  } catch (error) {
    console.error('Error fetching all executions:', error)
    return []
  }
}

/**
 * Get executions with OData query capabilities (filtering, sorting, pagination)
 */
export const getExecutionsWithOData = async (
  options?: ODataQueryOptions,
): Promise<ODataResponse<ExecutionResponseDto>> => {
  const tenant = getCurrentTenant()

  // Add strict enforcement of pagination parameters
  const safeOptions = { ...options }
  if (safeOptions.$top === undefined || safeOptions.$top <= 0) {
    safeOptions.$top = 10 // Default to 10 items if not specified
  }

  // Add cache busting parameter for pagination requests
  const timestamp = new Date().getTime()

  const queryString = buildODataQueryString(safeOptions)
  let endpoint = `${tenant}/odata/Executions`

  // Add the query string with cache busting
  if (queryString) {
    endpoint += `?${queryString}&_t=${timestamp}`
  } else {
    endpoint += `?_t=${timestamp}`
  }

  console.log(`Fetching executions with endpoint: ${endpoint}`)
  console.log(
    `Page: ${safeOptions.$skip ? safeOptions.$skip / safeOptions.$top + 1 : 1}, Size: ${safeOptions.$top}`,
  )

  try {
    const response = await api.get<unknown>(endpoint)

    // Process the response to ensure consistent structure
    const processedResponse = processODataResponse<ExecutionResponseDto>(response)

    // Strictly enforce the requested page size
    if (safeOptions.$top && processedResponse.value.length > safeOptions.$top) {
      console.warn(
        `OData returned ${processedResponse.value.length} items but only ${safeOptions.$top} were requested. Trimming results.`,
      )
      processedResponse.value = processedResponse.value.slice(0, safeOptions.$top)
    }

    console.log(`Received ${processedResponse.value.length} executions from OData`)

    return processedResponse
  } catch (error) {
    console.error('Error fetching executions with OData:', error)
    // Return empty response on error
    return { value: [] }
  }
}

/**
 * Get execution by ID using OData
 */
export const getExecutionById = async (id: string): Promise<ExecutionResponseDto> => {
  const tenant = getCurrentTenant()
  try {
    const response = await api.get<ExecutionResponseDto>(`${tenant}/odata/Executions(${id})`)
    return response
  } catch (error) {
    console.error(`Error fetching execution with ID ${id}:`, error)
    // Try fallback to regular API
    try {
      const fallbackResponse = await api.get<ExecutionResponseDto>(`${tenant}/api/executions/${id}`)
      return fallbackResponse
    } catch (fallbackError) {
      console.error(`Fallback also failed for execution with ID ${id}:`, fallbackError)
      throw error // Re-throw the original error
    }
  }
}

/**
 * Update execution status
 */
export const updateExecutionStatus = async (
  id: string,
  data: UpdateExecutionStatusDto,
): Promise<ExecutionResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.put<ExecutionResponseDto, UpdateExecutionStatusDto>(
    `${tenant}/api/executions/${id}/status`,
    data,
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

/**
 * Get download URL for execution logs
 */
export const getExecutionLogDownloadUrl = async (id: string): Promise<{ downloadUrl: string }> => {
  const tenant = getCurrentTenant()
  const response = await api.get<{ downloadUrl: string }>(
    `${tenant}/api/executions/${id}/logs/download`,
  )
  return response
}

/**
 * Download execution logs as a file
 */
export const downloadExecutionLogs = async (id: string, fileName?: string): Promise<void> => {
  try {
    // Get the pre-signed download URL
    const { downloadUrl } = await getExecutionLogDownloadUrl(id)

    const finalFileName = fileName || `execution_${id}_logs.log`

    // Try to fetch the file as blob first for better download control
    try {
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/octet-stream',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()

      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = finalFileName
      link.style.display = 'none'

      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl)
    } catch (fetchError) {
      console.warn('Fetch method failed, falling back to direct link:', fetchError)

      // Fallback to direct link method
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = finalFileName
      link.target = '_blank' // Ensure it doesn't navigate in the same tab
      link.rel = 'noopener noreferrer'
      link.style.display = 'none'

      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error('Error downloading execution logs:', error)
    throw error
  }
}
