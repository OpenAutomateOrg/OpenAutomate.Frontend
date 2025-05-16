import { api } from './client'
import {
  OrganizationUnit,
  OrganizationUnitsResponse,
  CreateOrganizationUnitDto,
} from '@/types/organization'

/**
 * Get current tenant from URL
 */
const getCurrentTenant = (): string => {
  // Extract tenant from URL path or use a default
  if (typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 1 && pathParts[1]) {
      return pathParts[1];
    }
  }
  return 'default'; // Fallback tenant
};

export const organizationUnitApi = {
  /**
   * Get all organization units that the current user belongs to
   * @returns Promise with organization units response
   */
  getMyOrganizationUnits: async (): Promise<OrganizationUnitsResponse> => {
    try {
      const tenant = getCurrentTenant();
      const response = await api.get<OrganizationUnitsResponse>(`${tenant}/api/ou/my-ous`);
      return response;
    } catch (error) {
      console.error('Error fetching organization units:', error);
      throw error;
    }
  },

  /**
   * Get organization unit by slug
   * @param slug The URL-friendly identifier of the organization unit
   * @returns Promise with organization unit
   */
  getBySlug: async (slug: string): Promise<OrganizationUnit> => {
    const tenant = getCurrentTenant();
    const response = await api.get<OrganizationUnit>(`${tenant}/api/ou/slug/${slug}`)
    return response
  },

  /**
   * Get organization unit by ID
   * @param id The unique identifier of the organization unit
   * @returns Promise with organization unit
   */
  getById: async (id: string): Promise<OrganizationUnit> => {
    const tenant = getCurrentTenant();
    const response = await api.get<OrganizationUnit>(`${tenant}/api/ou/${id}`)
    return response
  },

  /**
   * Create a new organization unit
   * @param data The data for creating the organization unit
   * @returns Promise with the newly created organization unit
   */
  create: async (data: CreateOrganizationUnitDto): Promise<OrganizationUnit> => {
    const tenant = getCurrentTenant();
    const response = await api.post<OrganizationUnit>(`${tenant}/api/ou/create`, data)
    return response
  },
}
