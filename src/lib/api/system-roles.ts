import { api } from './client'
import { User, SystemRole, SetSystemRoleDto } from '@/types/auth'

/**
 * API functions for managing system roles
 */
export const systemRolesApi = {
  /**
   * Get users by system role
   * @param role The system role to filter by
   * @returns Array of users with the specified role
   */
  async getUsersByRole(role: SystemRole): Promise<User[]> {
    return api.get<User[]>(`/users/roles/${role}`)
  },

  /**
   * Set a user's system role
   * @param userId The ID of the user
   * @param dto The role data to set
   */
  async setUserRole(userId: string, dto: SetSystemRoleDto): Promise<void> {
    await api.put<void>(`/users/${userId}/role`, dto)
  }
} 