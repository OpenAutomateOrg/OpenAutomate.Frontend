import { fetchApi } from './client'
import { User } from '@/types/auth'
import { api } from './client'
import { OrganizationUnit } from '@/types/organization'
import { SystemStatistics, RevenueStatistics } from '@/types/statistics'

export const adminApi = {
  /**
   * Get all users (system admin)
   * @returns Array of all users
   */
  async getAllUsers(): Promise<User[]> {
    return fetchApi<User[]>('api/admin/user/get-all', {
      method: 'GET',
    })
  },

  /**
   * Get user details by ID
   * @param userId The ID of the user
   * @returns User details
   */
  async getUserById(userId: string): Promise<User> {
    return fetchApi<User>(`api/admin/user/detail/${userId}`, {
      method: 'GET',
    })
  },

  /**
   * Update user information (firstName, lastName)
   * @param userId The ID of the user
   * @param data Object containing firstName and lastName
   * @returns Updated user
   */
  async updateUserInfo(
    userId: string,
    data: { firstName: string; lastName: string },
  ): Promise<User> {
    return fetchApi<User>(`api/admin/user/update-detail/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Change user password (admin action)
   * @param userId The ID of the user
   * @param data Object containing newPassword and confirmNewPassword
   * @returns Success message
   */
  async changeUserPassword(
    userId: string,
    data: { newPassword: string; confirmNewPassword: string },
  ): Promise<{ message: string }> {
    return fetchApi<{ message: string }>(`api/admin/user/change-password/${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  /**
   * Get all organization units (system admin access)
   * @returns Promise with array of all organization units
   */
  getAllOrganizationUnits: async (): Promise<OrganizationUnit[]> => {
    const response = await api.get<OrganizationUnit[]>('/api/admin/organization-unit/get-all')
    return response
  },

  /**
   * Delete an organization unit (system admin access)
   * @param id The ID of the organization unit to delete
   * @returns Promise that resolves when deletion is complete
   */
  deleteOrganizationUnit: async (id: string): Promise<void> => {
    await api.delete<void>(`/api/admin/organization-unit/${id}`)
  },

  /**
   * Get system resource statistics (system admin access)
   * @returns Promise with system statistics data
   */
  getSystemStatistics: async (): Promise<SystemStatistics> => {
    const response = await api.get<SystemStatistics>('/api/system/statistics/resources')
    return response
  },

  /**
   * Get revenue statistics (system admin access)
   * @returns Promise with revenue statistics data
   */
  getRevenueStatistics: async (): Promise<RevenueStatistics> => {
    const response = await api.get<RevenueStatistics>('/api/admin/revenue')
    return response
  },
}
