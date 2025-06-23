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

/**
 * Get tenant slug from URL path
 */
const getTenantSlug = (): string => {
  if (typeof window === 'undefined') return ''
  
  const path = window.location.pathname
  const segments = path.split('/').filter(Boolean)
  return segments.length > 0 ? segments[0] ?? '' : ''
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
      roleData
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
      roleData
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
      { authorityId }
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