import { api } from './client'
import {
  OrganizationUnit,
  OrganizationUnitsResponse,
  CreateOrganizationUnitDto,
} from '@/types/organization'

export const organizationUnitApi = {
  /**
   * Get all organization units that the current user belongs to
   * @returns Promise with organization units response
   */
  getMyOrganizationUnits: async (): Promise<OrganizationUnitsResponse> => {
    const response = await api.get<OrganizationUnitsResponse>('/api/ou/my-ous')
    return response
  },

  /**
   * Get organization unit by slug
   * @param slug The URL-friendly identifier of the organization unit
   * @returns Promise with organization unit
   */
  getBySlug: async (slug: string): Promise<OrganizationUnit> => {
    const response = await api.get<OrganizationUnit>(`/api/ou/slug/${slug}`)
    return response
  },

  /**
   * Get organization unit by ID
   * @param id The unique identifier of the organization unit
   * @returns Promise with organization unit
   */
  getById: async (id: string): Promise<OrganizationUnit> => {
    const response = await api.get<OrganizationUnit>(`/api/ou/${id}`)
    return response
  },

  /**
   * Create a new organization unit
   * @param data The data for creating the organization unit
   * @returns Promise with the newly created organization unit
   */
  create: async (data: CreateOrganizationUnitDto): Promise<OrganizationUnit> => {
    const response = await api.post<OrganizationUnit>('/api/ou/create', data)
    return response
  },

  /**
   * Get all organization units (system admin access)
   * @returns Promise with array of all organization units
   */
  getAllOrganizationUnits: async (): Promise<OrganizationUnit[]> => {
    const response = await api.get<OrganizationUnit[]>('/api/admin/organization-unit/get-all')
    return response
  },
}
