import { api } from './client'
import {
  OrganizationUnit,
  OrganizationUnitsResponse,
  CreateOrganizationUnitDto,
} from '@/types/organization'

export const organizationUnitApi = {
  // Get all organization units that the current user belongs to
  getMyOrganizationUnits: async (): Promise<OrganizationUnitsResponse> => {
    const response = await api.get<OrganizationUnitsResponse>('/api/ou/my-ous')
    return response
  },
  // Get organization unit by slug
  getBySlug: async (slug: string): Promise<OrganizationUnit> => {
    const response = await api.get<OrganizationUnit>(`/api/ou/slug/${slug}`)
    return response
  },
  // Get organization unit by ID
  getById: async (id: string): Promise<OrganizationUnit> => {
    const response = await api.get<OrganizationUnit>(`/api/ou/${id}`)
    return response
  },
  // Create a new organization unit
  create: async (data: CreateOrganizationUnitDto): Promise<OrganizationUnit> => {
    const response = await api.post<OrganizationUnit>('/api/ou/create', data)
    return response
  },
  // Update an organization unit by ID
  update: async (
    id: string,
    data: { name: string; description?: string },
  ): Promise<OrganizationUnit> => {
    const response = await api.put<OrganizationUnit>(`/api/ou/${id}`, data)
    return response
  }
}
