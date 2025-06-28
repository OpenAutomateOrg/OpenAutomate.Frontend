'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { PermissionLevel } from '@/types/auth'

interface PermissionWrapperProps {
  /**
   * The content to be shown if user has permission
   */
  children: ReactNode

  /**
   * The resource name to check permissions for
   */
  resource: string

  /**
   * The minimum permission level required
   */
  requiredPermission: PermissionLevel

  /**
   * Optional tenant override (uses current tenant if not provided)
   */
  tenant?: string

  /**
   * Content to show when user doesn't have permission (default: nothing)
   */
  fallback?: ReactNode

  /**
   * Show loading content while checking permissions
   */
  loadingContent?: ReactNode
}

/**
 * Component that conditionally renders content based on user permissions
 * 
 * This component uses the user's profile permissions to determine if they can
 * access a specific resource within the current (or specified) tenant.
 * 
 * @example
 * ```tsx
 * <PermissionWrapper resource="Asset" requiredPermission={PermissionLevel.Create}>
 *   <Button>Create Asset</Button>
 * </PermissionWrapper>
 * ```
 * 
 * @example
 * ```tsx
 * <PermissionWrapper 
 *   resource="Asset" 
 *   requiredPermission={PermissionLevel.View}
 *   fallback={<div>No access to assets</div>}
 * >
 *   <AssetsList />
 * </PermissionWrapper>
 * ```
 */
export function PermissionWrapper({
  children,
  resource,
  requiredPermission,
  tenant,
  fallback = null,
  loadingContent = null,
}: PermissionWrapperProps) {
  const { userProfile, isLoading, isSystemAdmin, hasPermission } = useAuth()

  // Show loading while auth is initializing
  if (isLoading) {
    return <>{loadingContent}</>
  }

  // System admins have access to everything
  if (isSystemAdmin) {
    return <>{children}</>
  }

  // If no user profile yet, wait for it to load or show fallback
  if (!userProfile) {
    return <>{fallback}</>
  }

  // Check if user has required permission
  if (!hasPermission(resource, requiredPermission, tenant)) {
    return <>{fallback}</>
  }

  // User has permission, render children
  return <>{children}</>
}

/**
 * Hook version for conditional rendering in components
 * 
 * @example
 * ```tsx
 * const canCreateAssets = usePermission('Asset', PermissionLevel.Create)
 * 
 * return (
 *   <div>
 *     {canCreateAssets && <Button>Create Asset</Button>}
 *   </div>
 * )
 * ```
 */
export function usePermission(
  resource: string, 
  requiredPermission: PermissionLevel, 
  tenant?: string
): boolean {
  const { userProfile, isLoading, isSystemAdmin, hasPermission } = useAuth()

  // While loading, assume no permission (prevents flash of content)
  if (isLoading || !userProfile) {
    return false
  }

  // System admins have all permissions
  if (isSystemAdmin) {
    return true
  }

  // Check permission
  return hasPermission(resource, requiredPermission, tenant)
} 