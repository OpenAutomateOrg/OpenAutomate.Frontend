import { api } from './client'

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

export interface OrganizationUnitUser {
  userId: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  joinedAt: string
}

function getCurrentTenant(): string {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.split('/')
    if (path.length > 1 && path[1]) {
      console.log('Current tenant:', path[1])
      return path[1]
    }
  }
  console.log('Using default tenant')
  return 'default'
}

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

function processODataResponse(response: unknown): ODataResponse<OrganizationUnitUser> {
  if (typeof response === 'object' && response !== null && 'value' in response) {
    return response as ODataResponse<OrganizationUnitUser>
  }
  if (Array.isArray(response)) {
    return { value: response as OrganizationUnitUser[], '@odata.count': response.length }
  }
  return { value: [] }
}

export const getOrganizationUnitUsersWithOData = async (
  options?: ODataQueryOptions,
): Promise<ODataResponse<OrganizationUnitUser>> => {
  const tenant = getCurrentTenant()
  const queryString = buildODataQueryString(options)
  const endpoint = queryString
    ? `${tenant}/odata/OrganizationUnitUsers?${queryString}`
    : `${tenant}/odata/OrganizationUnitUsers`

  try {
    const response = await api.get<unknown>(endpoint)
    console.log('getOrganizationUnitUsersWithOData', response)
    return processODataResponse(response)
  } catch (error) {
    console.error('Error fetching OrganizationUnitUsers:', error)
    return { value: [], '@odata.count': 0 }
  }
}
// This function retrieves the total count of organization unit users using OData query capabilities.
export const getOrganizationUnitUsersODataTotal = async (
  tenant: string,
): Promise<ODataResponse<OrganizationUnitUser>> => {
  const endpoint = `${tenant}/odata/OrganizationUnitUsers`

  try {
    const response = await api.get<ODataResponse<OrganizationUnitUser>>(endpoint)
    console.log(`getOrganizationUnitUsersOData for tenant ${tenant}:`, response)
    return processODataResponse(response)
  } catch (error) {
    console.error(`Error fetching OrganizationUnitUsers for tenant ${tenant}:`, error)
    return { value: [], '@odata.count': 0 }
  }
}

export interface OrganizationUnitUserResponse {
  count: number
  users: OrganizationUnitUser[]
}

export interface AuthorityDto {
  id: string
  name: string
  description: string
}

export const organizationUnitUserApi = {
  getUsers: async (tenant: string): Promise<OrganizationUnitUser[]> => {
    const res = await api.get<OrganizationUnitUserResponse>(`${tenant}/api/ou/users`)
    return res.users
  },

  /**
   * Get all roles in a specific organization unit by tenant slug
   */
  getRolesInOrganizationUnit: async (tenant: string): Promise<AuthorityDto[]> => {
    return api.get<AuthorityDto[]>(`${tenant}/api/ou/users/roles`)
  },

  /**
   * Assign multiple roles to a user in one request (replaces all existing roles)
   * @param userId The user ID
   * @param authorityIds List of role/authority IDs to assign
   */
  assignRolesBulk: async (userId: string, authorityIds: string[]): Promise<void> => {
    const tenant = getCurrentTenant()
    const formattedAuthorityIds = authorityIds.map((id) => id.trim())
    const endpoint = `${tenant}/api/author/user/${userId}/assign-multiple-roles`

    try {
      return await api.post<void>(endpoint, { authorityIds: formattedAuthorityIds })
    } catch (error) {
      console.error('Error assigning roles:', error)
      throw error
    }
  },
}

export const deleteOrganizationUnitUser = async (userId: string): Promise<void> => {
  const tenant = getCurrentTenant()
  await api.delete<void>(`${tenant}/api/ou/users/${userId}`)
}

/**
 * Bulk delete organization unit users
 */
export const bulkDeleteOrganizationUnitUsers = async (userIds: string[]): Promise<void> => {
  const tenant = getCurrentTenant()
  await api.deleteWithData(`${tenant}/api/bulk-delete/remove-users`, { ids: userIds })
}
