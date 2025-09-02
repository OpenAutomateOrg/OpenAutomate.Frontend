import { api } from './client'

// ===== DTOs and Interfaces =====

export interface CreateScheduleDto {
  name: string
  description?: string
  isEnabled?: boolean
  recurrenceType: RecurrenceType
  cronExpression?: string
  oneTimeExecution?: string
  timeZoneId: string
  automationPackageId: string // Will be converted to GUID
  botAgentId: string // Will be converted to GUID
}

export interface UpdateScheduleDto {
  name?: string
  description?: string
  recurrenceType?: RecurrenceType
  cronExpression?: string
  oneTimeExecution?: string // ISO date string
  timeZoneId?: string
  automationPackageId?: string
  botAgentId?: string
}

export interface ScheduleResponseDto {
  id: string
  name: string
  description?: string
  isEnabled: boolean
  recurrenceType: RecurrenceType
  cronExpression?: string
  oneTimeExecution?: string // ISO date string
  timeZoneId: string
  automationPackageId: string
  botAgentId: string
  createdAt: string
  updatedAt: string
  // Navigation properties
  automationPackageName?: string
  botAgentName?: string
  nextRunTime?: string
}

export enum RecurrenceType {
  Once = 'Once',
  Minutes = 'Minutes',
  Hourly = 'Hourly',
  Daily = 'Daily',
  Weekly = 'Weekly',
  Advanced = 'Advanced',
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

// ===== Helper Functions =====

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

// ===== API Functions =====

/**
 * Create a new schedule
 */
export const createSchedule = async (data: CreateScheduleDto): Promise<ScheduleResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.post<ScheduleResponseDto, CreateScheduleDto>(
    `${tenant}/api/schedules`,
    data,
  )
  return response
}

/**
 * Get all schedules for the current tenant
 */
export const getAllSchedules = async (): Promise<ScheduleResponseDto[]> => {
  const tenant = getCurrentTenant()
  try {
    const response = await api.get<ScheduleResponseDto[]>(`${tenant}/api/schedules`)
    return response
  } catch (error) {
    console.error('Error fetching all schedules:', error)
    return []
  }
}

/**
 * Get schedules with OData query capabilities (filtering, sorting, pagination)
 */
export const getSchedulesWithOData = async (
  options?: ODataQueryOptions,
): Promise<ODataResponse<ScheduleResponseDto>> => {
  const tenant = getCurrentTenant()

  // Add strict enforcement of pagination parameters
  const safeOptions = { ...options }
  if (safeOptions.$top === undefined || safeOptions.$top <= 0) {
    safeOptions.$top = 10 // Default to 10 items if not specified
  }

  // Add cache busting parameter for pagination requests
  const timestamp = new Date().getTime()

  const queryString = buildODataQueryString(safeOptions)
  let endpoint = `${tenant}/odata/Schedules`

  // Add the query string with cache busting
  if (queryString) {
    endpoint += `?${queryString}&_t=${timestamp}`
  } else {
    endpoint += `?_t=${timestamp}`
  }

  console.log(`Fetching schedules with endpoint: ${endpoint}`)
  console.log(
    `Page: ${safeOptions.$skip ? safeOptions.$skip / safeOptions.$top + 1 : 1}, Size: ${safeOptions.$top}`,
  )

  try {
    const response = await api.get<unknown>(endpoint)

    // Process the response to ensure consistent structure
    const processedResponse = processODataResponse<ScheduleResponseDto>(response)

    // Strictly enforce the requested page size
    if (safeOptions.$top && processedResponse.value.length > safeOptions.$top) {
      console.warn(
        `OData returned ${processedResponse.value.length} items but only ${safeOptions.$top} were requested. Trimming results.`,
      )
      processedResponse.value = processedResponse.value.slice(0, safeOptions.$top)
    }

    console.log(`Received ${processedResponse.value.length} schedules from OData`)

    return processedResponse
  } catch (error) {
    console.error('Error fetching schedules with OData:', error)
    // Return empty response on error
    return { value: [] }
  }
}
// This function retrieves the total count of Schedules using OData query capabilities.
export const getSchedulesODataTotal = async (
  tenant: string,
): Promise<ODataResponse<ScheduleResponseDto>> => {
  const endpoint = `${tenant}/odata/Schedules`

  try {
    const response = await api.get<ODataResponse<ScheduleResponseDto>>(endpoint)
    console.log(`getSchedulesODataTotal for tenant ${tenant}:`, response)
    return processODataResponse(response)
  } catch (error) {
    console.error(`Error fetching Schedules for tenant ${tenant}:`, error)
    return { value: [], '@odata.count': 0 }
  }
}

/**
 * Get schedule by ID
 */
export const getScheduleById = async (id: string): Promise<ScheduleResponseDto> => {
  const tenant = getCurrentTenant()
  try {
    const response = await api.get<ScheduleResponseDto>(`${tenant}/api/schedules/${id}`)
    return response
  } catch (error) {
    console.error(`Error fetching schedule with ID ${id}:`, error)
    throw error
  }
}

/**
 * Update an existing schedule
 */
export const updateSchedule = async (
  id: string,
  data: UpdateScheduleDto,
): Promise<ScheduleResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.put<ScheduleResponseDto, UpdateScheduleDto>(
    `${tenant}/api/schedules/${id}`,
    data,
  )
  return response
}

/**
 * Delete a schedule
 */
export const deleteSchedule = async (id: string): Promise<void> => {
  const tenant = getCurrentTenant()
  await api.delete(`${tenant}/api/schedules/${id}`)
}

/**
 * Bulk delete schedules
 */
export const bulkDeleteSchedules = async (ids: string[]): Promise<void> => {
  const tenant = getCurrentTenant()
  await api.deleteWithData(`${tenant}/api/bulk-delete/schedules`, { ids })
}

/**
 * Enable a schedule
 */
export const enableSchedule = async (id: string): Promise<ScheduleResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.post<ScheduleResponseDto>(`${tenant}/api/schedules/${id}/enable`)
  return response
}

/**
 * Disable a schedule
 */
export const disableSchedule = async (id: string): Promise<ScheduleResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.post<ScheduleResponseDto>(`${tenant}/api/schedules/${id}/disable`)
  return response
}

// ===== Helper Functions for Frontend =====

/**
 * Format next run time for display
 */
export const formatNextRunTime = (nextRunTime?: string): string => {
  if (!nextRunTime) return 'Not scheduled'

  try {
    const date = new Date(nextRunTime)
    if (isNaN(date.getTime())) return 'Invalid date'

    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return 'Invalid date'
  }
}

/**
 * Get display name for recurrence type
 */
export const getRecurrenceTypeDisplayName = (type: RecurrenceType): string => {
  switch (type) {
    case RecurrenceType.Once:
      return 'Once'
    case RecurrenceType.Minutes:
      return 'Every few minutes'
    case RecurrenceType.Hourly:
      return 'Hourly'
    case RecurrenceType.Daily:
      return 'Daily'
    case RecurrenceType.Weekly:
      return 'Weekly'
    case RecurrenceType.Advanced:
      return 'Custom (Cron)'
    default:
      return 'Unknown'
  }
}

/**
 * Validate cron expression (basic validation)
 */
export const validateCronExpression = (expression: string): boolean => {
  if (!expression) return false

  // Basic validation: should have 5 or 6 parts separated by spaces
  const parts = expression.trim().split(/\s+/)
  return parts.length >= 5 && parts.length <= 6
}

/**
 * Convert form data to create/update DTO
 */
export const convertFormDataToDto = (formData: {
  name: string
  description?: string
  recurrenceType: RecurrenceType
  timeZoneId?: string
  automationPackageId: string
  botAgentId: string
  oneTimeExecution?: string
  cronExpression?: string
}): CreateScheduleDto => {
  const baseDto = {
    name: formData.name,
    description: formData.description,
    recurrenceType: formData.recurrenceType as RecurrenceType,
    timeZoneId: formData.timeZoneId || 'UTC',
    automationPackageId: formData.automationPackageId,
    botAgentId: formData.botAgentId,
  }

  // Handle different recurrence types
  if (formData.recurrenceType === RecurrenceType.Once && formData.oneTimeExecution) {
    return {
      ...baseDto,
      oneTimeExecution: formData.oneTimeExecution,
    }
  }

  if (formData.recurrenceType === RecurrenceType.Advanced && formData.cronExpression) {
    return {
      ...baseDto,
      cronExpression: formData.cronExpression,
    }
  }

  // For other types, we might need to generate cron expressions
  // This can be implemented based on the UI requirements
  return baseDto
}
