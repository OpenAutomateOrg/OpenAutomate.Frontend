'use client'

import { useAuth } from './use-auth'
import { PermissionLevel } from '@/types/auth'
import { Resources } from '@/lib/constants/resources'

/**
 * Custom hook for checking permissions
 * Provides a convenient interface for components to check user permissions
 */
export function usePermission() {
  const { userProfile, isLoading, isSystemAdmin, hasPermission } = useAuth()

  /**
   * Check if user has permission for a specific resource and level
   */
  const checkPermission = (
    resource: string,
    requiredPermission: PermissionLevel,
    tenant?: string
  ): boolean => {
    // While loading, assume no permission (prevents flash of content)
    if (isLoading || !userProfile) {
      return false
    }

    // System admins have all permissions
    if (isSystemAdmin) {
      return true
    }

    // Check permission using auth context
    return hasPermission(resource, requiredPermission, tenant)
  }

  /**
   * Convenience methods for common permission checks
   */
  const canView = (resource: string, tenant?: string) => 
    checkPermission(resource, PermissionLevel.View, tenant)

  const canCreate = (resource: string, tenant?: string) => 
    checkPermission(resource, PermissionLevel.Create, tenant)

  const canUpdate = (resource: string, tenant?: string) => 
    checkPermission(resource, PermissionLevel.Update, tenant)

  const canDelete = (resource: string, tenant?: string) => 
    checkPermission(resource, PermissionLevel.Delete, tenant)

  /**
   * Resource-specific permission checks
   */
  const permissions = {
    // Asset permissions
    assets: {
      canView: (tenant?: string) => canView(Resources.ASSET, tenant),
      canCreate: (tenant?: string) => canCreate(Resources.ASSET, tenant),
      canUpdate: (tenant?: string) => canUpdate(Resources.ASSET, tenant),
      canDelete: (tenant?: string) => canDelete(Resources.ASSET, tenant),
    },

    // Agent permissions
    agents: {
      canView: (tenant?: string) => canView(Resources.AGENT, tenant),
      canCreate: (tenant?: string) => canCreate(Resources.AGENT, tenant),
      canUpdate: (tenant?: string) => canUpdate(Resources.AGENT, tenant),
      canDelete: (tenant?: string) => canDelete(Resources.AGENT, tenant),
    },

    // Package permissions
    packages: {
      canView: (tenant?: string) => canView(Resources.PACKAGE, tenant),
      canCreate: (tenant?: string) => canCreate(Resources.PACKAGE, tenant),
      canUpdate: (tenant?: string) => canUpdate(Resources.PACKAGE, tenant),
      canDelete: (tenant?: string) => canDelete(Resources.PACKAGE, tenant),
    },

    // Execution permissions
    executions: {
      canView: (tenant?: string) => canView(Resources.EXECUTION, tenant),
      canCreate: (tenant?: string) => canCreate(Resources.EXECUTION, tenant),
      canUpdate: (tenant?: string) => canUpdate(Resources.EXECUTION, tenant),
      canDelete: (tenant?: string) => canDelete(Resources.EXECUTION, tenant),
    },

    // Schedule permissions
    schedules: {
      canView: (tenant?: string) => canView(Resources.SCHEDULE, tenant),
      canCreate: (tenant?: string) => canCreate(Resources.SCHEDULE, tenant),
      canUpdate: (tenant?: string) => canUpdate(Resources.SCHEDULE, tenant),
      canDelete: (tenant?: string) => canDelete(Resources.SCHEDULE, tenant),
    },

    // User permissions
    users: {
      canView: (tenant?: string) => canView(Resources.USER, tenant),
      canCreate: (tenant?: string) => canCreate(Resources.USER, tenant),
      canUpdate: (tenant?: string) => canUpdate(Resources.USER, tenant),
      canDelete: (tenant?: string) => canDelete(Resources.USER, tenant),
    },

    // Organization Unit permissions
    organizationUnit: {
      canView: (tenant?: string) => canView(Resources.ORGANIZATION_UNIT, tenant),
      canCreate: (tenant?: string) => canCreate(Resources.ORGANIZATION_UNIT, tenant),
      canUpdate: (tenant?: string) => canUpdate(Resources.ORGANIZATION_UNIT, tenant),
      canDelete: (tenant?: string) => canDelete(Resources.ORGANIZATION_UNIT, tenant),
    },
  }

  return {
    // Base permission checking
    checkPermission,
    canView,
    canCreate,
    canUpdate,
    canDelete,

    // Resource-specific helpers
    permissions,

    // Auth state
    isLoading,
    isSystemAdmin,
    hasUserProfile: !!userProfile,
  }
}

/**
 * Hook specifically for checking if user can access a feature
 * Returns boolean indicating access level
 */
export function useFeatureAccess(
  resource: string,
  requiredPermission: PermissionLevel,
  tenant?: string
): {
  hasAccess: boolean
  isLoading: boolean
  isSystemAdmin: boolean
} {
  const { checkPermission, isLoading, isSystemAdmin } = usePermission()

  return {
    hasAccess: checkPermission(resource, requiredPermission, tenant),
    isLoading,
    isSystemAdmin,
  }
} 