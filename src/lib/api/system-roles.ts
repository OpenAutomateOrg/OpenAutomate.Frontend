/**
 * API functions for system role management
 */

import { fetchApi } from './client'
import { SystemRole, User, SetSystemRoleDto } from '@/types/auth'

/**
 * System roles API methods
 */
export const systemRolesApi = {
  /**
   * Get users by role
   *
   * @param role The system role to filter by
   * @returns Array of users with the specified role
   */
  async getUsersByRole(role: SystemRole): Promise<User[]> {
    return fetchApi<User[]>(`api/users/by-role/${role}`, {
      method: 'GET',
    })
  },

  /**
   * Set a user's system role
   *
   * @param userId The ID of the user to update
   * @param dto The data transfer object containing the new role
   * @returns The updated user
   */
  async setUserRole(userId: string, dto: SetSystemRoleDto): Promise<User> {
    return fetchApi<User>(`api/users/${userId}/system-role`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    })
  },

  /**
   * Get all system roles
   *
   * @returns Array of available system roles
   */
  async getAllRoles(): Promise<{ id: SystemRole; name: string }[]> {
    return fetchApi<{ id: SystemRole; name: string }[]>('api/system-roles', {
      method: 'GET',
    })
  },
}
