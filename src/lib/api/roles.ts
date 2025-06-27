import { fetchApi } from './client'

// Types for Role Management API
export interface CreateRoleDto {
  name: string
  description?: string
  resourcePermissions: ResourcePermissionDto[]
}

export interface UpdateRoleDto {
  name?: string
  description?: string
  resourcePermissions?: ResourcePermissionDto[]
}

export interface ResourcePermissionDto {
  resourceName: string
  permission: number
}

export interface RoleDto {
  id: string
  name: string
  description: string
  permissions?: ResourcePermissionDto[]
}

export interface RoleWithPermissionsDto extends RoleDto {
  permissions: ResourcePermissionDto[]
  isSystemAuthority: boolean
  createdAt: string
  updatedAt?: string
}

export interface AvailableResourceDto {
  resourceName: string
  displayName: string
  description: string
  availablePermissions: PermissionLevelDto[]
}

export interface PermissionLevelDto {
  level: number
  name: string
  description: string
}

export interface AssignAuthorityDto {
  authorityId: string
}

// OData support for roles (client-side pagination)
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

/**
 * Get tenant slug from URL path
 */
const getTenantSlug = (): string => {
  if (typeof window === 'undefined') return ''

  const path = window.location.pathname
  const segments = path.split('/').filter(Boolean)
  return segments.length > 0 ? segments[0] : ''
}

/**
 * Roles API client
 */
export const rolesApi = {
  /**
   * Get all available resources with permission levels for role creation
   */
  getAvailableResources: async (): Promise<AvailableResourceDto[]> => {
    const tenant = getTenantSlug()
    return fetchApi<AvailableResourceDto[]>(`${tenant}/api/author/resources`)
  },

  /**
   * Get all roles/authorities in the organization
   */
  getAllRoles: async (): Promise<RoleWithPermissionsDto[]> => {
    const tenant = getTenantSlug()
    return fetchApi<RoleWithPermissionsDto[]>(`${tenant}/api/author/authorities`)
  },

  /**
   * Get roles with OData-style filtering and pagination (client-side)
   */
  getRolesWithOData: async (options?: ODataQueryOptions): Promise<ODataResponse<RoleWithPermissionsDto>> => {
    const allRoles = await rolesApi.getAllRoles()
    
    let filteredRoles = [...allRoles]
    
    // Apply filtering
    if (options?.$filter) {
      filteredRoles = applyRoleFilters(filteredRoles, options.$filter)
    }
    
    // Apply ordering
    if (options?.$orderby) {
      filteredRoles = applySorting(filteredRoles, options.$orderby)
    }
    
    const totalCount = filteredRoles.length
    
    // Apply pagination
    if (options?.$skip) {
      filteredRoles = filteredRoles.slice(options.$skip)
    }
    
    if (options?.$top) {
      filteredRoles = filteredRoles.slice(0, options.$top)
    }
    
    return {
      value: filteredRoles,
      '@odata.count': options?.$count ? totalCount : undefined
    }
  },

  /**
   * Get a specific role by ID
   */
  getRoleById: async (roleId: string): Promise<RoleWithPermissionsDto> => {
    const tenant = getTenantSlug()
    return fetchApi<RoleWithPermissionsDto>(`${tenant}/api/author/authority/${roleId}`)
  },

  /**
   * Create a new role/authority
   */
  createRole: async (roleData: CreateRoleDto): Promise<RoleWithPermissionsDto> => {
    const tenant = getTenantSlug()
    return fetchApi<RoleWithPermissionsDto>(
      `${tenant}/api/author/authority`,
      {
        method: 'POST',
      },
      roleData,
    )
  },

  /**
   * Update an existing role/authority
   */
  updateRole: async (roleId: string, roleData: UpdateRoleDto): Promise<void> => {
    const tenant = getTenantSlug()
    return fetchApi<void>(
      `${tenant}/api/author/authority/${roleId}`,
      {
        method: 'PUT',
      },
      roleData,
    )
  },

  /**
   * Delete a role/authority
   */
  deleteRole: async (roleId: string): Promise<void> => {
    const tenant = getTenantSlug()
    return fetchApi<void>(`${tenant}/api/author/authority/${roleId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Get user's assigned authorities
   */
  getUserAuthorities: async (userId: string): Promise<RoleDto[]> => {
    const tenant = getTenantSlug()
    return fetchApi<RoleDto[]>(`${tenant}/api/author/user/${userId}`)
  },

  /**
   * Assign a role to a user
   */
  assignRoleToUser: async (userId: string, authorityId: string): Promise<void> => {
    const tenant = getTenantSlug()
    return fetchApi<void>(
      `${tenant}/api/author/user/${userId}`,
      {
        method: 'POST',
      },
      { authorityId },
    )
  },

  /**
   * Remove a role from a user
   */
  removeRoleFromUser: async (userId: string, authorityId: string): Promise<void> => {
    const tenant = getTenantSlug()
    return fetchApi<void>(`${tenant}/api/author/user/${userId}/authority/${authorityId}`, {
      method: 'DELETE',
    })
  },
}

/**
 * Permission level constants (matching backend)
 */
export const PermissionLevels = {
  NO_ACCESS: 0,
  VIEW: 1,
  CREATE: 2,
  UPDATE: 3,
  DELETE: 4,
} as const

/**
 * Get permission level description
 */
export const getPermissionDescription = (level: number): string => {
  switch (level) {
    case PermissionLevels.NO_ACCESS:
      return 'No Access'
    case PermissionLevels.VIEW:
      return 'View Only'
    case PermissionLevels.CREATE:
      return 'View & Create'
    case PermissionLevels.UPDATE:
      return 'View, Create & Update (includes Execute)'
    case PermissionLevels.DELETE:
      return 'Full Administrative Access'
    default:
      return 'Invalid Permission'
  }
}

/**
 * Check if permission level is valid
 */
export const isValidPermissionLevel = (level: number): boolean => {
  return level >= PermissionLevels.NO_ACCESS && level <= PermissionLevels.DELETE
}


/**
 * Helper functions for client-side OData filtering
 */
function applyRoleFilters(roles: RoleWithPermissionsDto[], filterString: string): RoleWithPermissionsDto[] {
  if (!filterString) return roles
  
  // Simple parsing for common filter patterns
  // This supports basic contains, eq, and boolean filters
  const filters = parseFilterString(filterString)
  
  return roles.filter(role => {
    return filters.every(filter => {
      switch (filter.field) {
        case 'name':
          if (filter.operation === 'contains') {
            return role.name.toLowerCase().includes(filter.value.toLowerCase())
          } else if (filter.operation === 'eq') {
            return role.name.toLowerCase() === filter.value.toLowerCase()
          }
          break
        case 'description':
          if (filter.operation === 'contains') {
            return role.description.toLowerCase().includes(filter.value.toLowerCase())
          } else if (filter.operation === 'eq') {
            return role.description.toLowerCase() === filter.value.toLowerCase()
          }
          break
        case 'isSystemAuthority':
          if (filter.operation === 'eq') {
            return role.isSystemAuthority === (filter.value === 'true')
          }
          break
        case 'resourceName':
          if (filter.operation === 'any') {
            return role.permissions?.some(p => 
              p.resourceName.toLowerCase().includes(filter.value.toLowerCase())
            ) ?? false
          }
          break
      }
      return true
    })
  })
}

function parseFilterString(filterString: string): Array<{field: string, operation: string, value: string}> {
  const filters: Array<{field: string, operation: string, value: string}> = []
  
  // Split by 'and' and parse each part
  const parts = filterString.split(' and ')
  
  for (const part of parts) {
    const trimmed = part.trim()
    
    // Parse contains(tolower(field),'value')
    const containsMatch = trimmed.match(/contains\(tolower\((\w+)\),'(.+?)'\)/)
    if (containsMatch) {
      filters.push({
        field: containsMatch[1],
        operation: 'contains',
        value: containsMatch[2]
      })
      continue
    }
    
    // Parse field eq 'value' or field eq true/false
    const eqMatch = trimmed.match(/(\w+)\s+eq\s+(?:'(.+?)'|(\w+))/)
    if (eqMatch) {
      filters.push({
        field: eqMatch[1],
        operation: 'eq',
        value: eqMatch[2] || eqMatch[3]
      })
      continue
    }
    
    // Parse permissions/any(p: condition)
    const anyMatch = trimmed.match(/(\w+)\/any\([^:]+:\s*(.+)\)/)
    if (anyMatch) {
      const nestedCondition = anyMatch[2]
      const nestedContains = nestedCondition.match(/contains\(tolower\([^)]+\),'(.+?)'\)/)
      if (nestedContains) {
        filters.push({
          field: 'resourceName', // We'll handle this specially
          operation: 'any',
          value: nestedContains[1]
        })
      }
    }
  }
  
  return filters
}

function applySorting(roles: RoleWithPermissionsDto[], orderBy: string): RoleWithPermissionsDto[] {
  const [field, direction = 'asc'] = orderBy.split(' ')
  
  return [...roles].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (field) {
      case 'name':
        aValue = a.name
        bValue = b.name
        break
      case 'description':
        aValue = a.description
        bValue = b.description
        break
      case 'createdAt':
        aValue = new Date(a.createdAt)
        bValue = new Date(b.createdAt)
        break
      default:
        return 0
    }
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })
} 

