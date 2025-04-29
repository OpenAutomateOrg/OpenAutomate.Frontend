/**
 * Organization unit entity
 */
export interface OrganizationUnit {
  id: string;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Response from the API when getting all organization units for a user
 */
export interface OrganizationUnitsResponse {
  count: number;
  organizationUnits: OrganizationUnit[];
}

/**
 * Data required to create a new organization unit
 */
export interface CreateOrganizationUnitDto {
  name: string;
  description?: string;
} 