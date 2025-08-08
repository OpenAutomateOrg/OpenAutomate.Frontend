import { api } from './client'

export interface CreateAutomationPackageDto {
  name: string
  description: string
}

export interface PackageVersionResponseDto {
  id: string
  versionNumber: string
  fileName: string
  fileSize: number
  contentType: string
  isActive: boolean
  uploadedAt: string
}

export interface AutomationPackageResponseDto {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  versions: PackageVersionResponseDto[]
}

export interface UploadPackageVersionRequest {
  file: File
  version: string
}

export interface UploadPackageWithMetadataRequest {
  file: File
  name?: string
  description?: string
  version?: string
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
 * Create a new automation package
 */
export const createAutomationPackage = async (
  data: CreateAutomationPackageDto,
): Promise<AutomationPackageResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.post<AutomationPackageResponseDto, CreateAutomationPackageDto>(
    `${tenant}/api/packages`,
    data,
  )
  return response
}

/**
 * Get an automation package by ID
 */
export const getAutomationPackageById = async (
  id: string,
): Promise<AutomationPackageResponseDto> => {
  const tenant = getCurrentTenant()
  const response = await api.get<AutomationPackageResponseDto>(`${tenant}/api/packages/${id}`)
  return response
}

/**
 * Get all automation packages
 */
export const getAllAutomationPackages = async (): Promise<AutomationPackageResponseDto[]> => {
  const tenant = getCurrentTenant()
  const response = await api.get<AutomationPackageResponseDto[]>(`${tenant}/api/packages`)
  return response
}

/**
 * Upload a package file and automatically create the package with extracted metadata
 */
export const uploadPackageWithAutoCreation = async (
  data: UploadPackageWithMetadataRequest,
): Promise<AutomationPackageResponseDto> => {
  const tenant = getCurrentTenant()

  const formData = new FormData()
  formData.append('file', data.file)
  if (data.name) formData.append('name', data.name)
  if (data.description) formData.append('description', data.description)
  if (data.version) formData.append('version', data.version)

  const response = await api.post<AutomationPackageResponseDto>(
    `${tenant}/api/packages/upload`,
    formData,
  )
  return response
}

/**
 * Upload a new version to an existing package
 */
export const uploadPackageVersion = async (
  packageId: string,
  data: UploadPackageVersionRequest,
): Promise<PackageVersionResponseDto> => {
  const tenant = getCurrentTenant()

  const formData = new FormData()
  formData.append('file', data.file)
  formData.append('version', data.version)

  const response = await api.post<PackageVersionResponseDto>(
    `${tenant}/api/packages/${packageId}/versions`,
    formData,
  )
  return response
}

/**
 * Get download URL for a specific package version
 */
export const getPackageDownloadUrl = async (
  packageId: string,
  version: string,
): Promise<{ downloadUrl: string }> => {
  const tenant = getCurrentTenant()
  const response = await api.get<{ downloadUrl: string }>(
    `${tenant}/api/packages/${packageId}/versions/${version}/download`,
  )
  return response
}

/**
 * Delete an automation package and all its versions
 */
export const deleteAutomationPackage = async (id: string): Promise<void> => {
  const tenant = getCurrentTenant()
  await api.delete<void>(`${tenant}/api/packages/${id}`)
}

/**
 * Delete a specific package version
 */
export const deletePackageVersion = async (packageId: string, version: string): Promise<void> => {
  const tenant = getCurrentTenant()
  await api.delete<void>(`${tenant}/api/packages/${packageId}/versions/${version}`)
}

/**
 * Type guard for OData response
 */
function isODataResponse(
  obj: unknown,
): obj is { value: AutomationPackageResponseDto[]; '@odata.count'?: number } {
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
        queryParams.append(key, String(value))
      }
    })
  }

  return queryParams.toString()
}

/**
 * Process raw response into standard OData format
 */
function processODataResponse(response: unknown): ODataResponse<AutomationPackageResponseDto> {
  // First, check if the response already has the expected OData format
  if (isODataResponse(response)) {
    if (Array.isArray(response.value)) {
      console.log(
        `Received ${response.value.length} packages from OData. Total count: ${response['@odata.count']}`,
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
      value: response as AutomationPackageResponseDto[],
      '@odata.count': response.length,
    }
  }

  // If response is an object but doesn't have a value property
  if (typeof response === 'object' && response !== null) {
    const arrayProps = Object.keys(response).filter((key) =>
      Array.isArray((response as Record<string, unknown[]>)[key]),
    )

    if (arrayProps.length > 0) {
      const arrayProp = arrayProps[0]
      console.log(`Found array property "${arrayProp}" in response`)
      const arr = (response as Record<string, unknown[]>)[
        arrayProp
      ] as AutomationPackageResponseDto[]
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
 * Get automation packages with OData query capabilities (filtering, sorting, pagination)
 */
export const getAutomationPackagesWithOData = async (
  options?: ODataQueryOptions,
): Promise<ODataResponse<AutomationPackageResponseDto>> => {
  const tenant = getCurrentTenant()
  const queryString = buildODataQueryString(options)
  let endpoint = `${tenant}/odata/AutomationPackages`
  if (queryString) {
    endpoint += `?${queryString}`
  }

  console.log('OData query endpoint:', endpoint)
  try {
    const response = await api.get<unknown>(endpoint)
    console.log('Raw OData response:', response)
    return processODataResponse(response)
  } catch (error) {
    console.error('Error fetching packages with OData:', error)
    return { value: [] }
  }
}

// This function retrieves the total count of automation packages using OData query capabilities.
export const getAutomationPackagesODataTotal = async (
  tenant: string,
): Promise<ODataResponse<AutomationPackageResponseDto>> => {
  const endpoint = `${tenant}/odata/AutomationPackages`

  try {
    const response = await api.get<ODataResponse<AutomationPackageResponseDto>>(endpoint)
    console.log(`getAutomationPackagesODataTotal for tenant ${tenant}:`, response)
    return processODataResponse(response)
  } catch (error) {
    console.error(`Error fetching Automation Packages for tenant ${tenant}:`, error)
    return { value: [], '@odata.count': 0 }
  }
}

/**
 * Get package versions with OData query capabilities
 */
export const getPackageVersionsWithOData = async (
  options?: ODataQueryOptions,
): Promise<ODataResponse<PackageVersionResponseDto>> => {
  const tenant = getCurrentTenant()
  const queryString = buildODataQueryString(options)
  let endpoint = `${tenant}/odata/PackageVersions`
  if (queryString) {
    endpoint += `?${queryString}`
  }

  console.log('OData query endpoint for versions:', endpoint)
  try {
    const response = await api.get<unknown>(endpoint)
    console.log('Raw OData response for versions:', response)

    // Process response similarly to packages
    if (Array.isArray(response)) {
      return {
        value: response as PackageVersionResponseDto[],
        '@odata.count': response.length,
      }
    }

    return { value: [] }
  } catch (error) {
    console.error('Error fetching package versions with OData:', error)
    return { value: [] }
  }
}
