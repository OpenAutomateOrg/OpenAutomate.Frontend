'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import { PermissionLevel } from '@/types/auth'

interface PermissionRouteGuardProps {
  /**
   * The content to be protected by the permission guard
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
   * The path to redirect unauthorized users to
   * @default "/{tenant}/dashboard"
   */
  redirectPath?: string

  /**
   * Custom loading component
   * @default null (no loading shown)
   */
  loadingComponent?: ReactNode
}

/**
 * Route guard component that checks user permissions before rendering protected content
 * 
 * This component uses the user's profile permissions to determine if they can access
 * a specific resource within the current tenant. If access is denied, the user is
 * redirected to a safe page.
 * 
 * @example
 * ```tsx
 * <PermissionRouteGuard resource="AssetResource" requiredPermission={1}>
 *   <AssetManagementPage />
 * </PermissionRouteGuard>
 * ```
 */
export function PermissionRouteGuard({
  children,
  resource,
  requiredPermission,
  redirectPath,
  loadingComponent = null,
}: PermissionRouteGuardProps) {
  const { userProfile, isLoading, isSystemAdmin, hasPermission } = useAuth()
  const router = useRouter()
  const params = useParams()
  
  // Get current tenant from URL params
  const tenant = params.tenant as string

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return

    // System admins have access to everything
    if (isSystemAdmin) return

    // If no user profile yet, wait for it to load
    if (!userProfile) return

    // Check if user has required permission
    if (!hasPermission(resource, requiredPermission, tenant)) {
      // Redirect to safe page
      const fallbackPath = redirectPath || `/${tenant}/dashboard`
      router.replace(fallbackPath)
      return
    }
  }, [isLoading, isSystemAdmin, userProfile, hasPermission, resource, requiredPermission, tenant, router, redirectPath])

  // Show loading while auth is initializing
  if (isLoading) {
    return loadingComponent
  }

  // Show loading while profile is loading (user exists but profile doesn't)
  if (!isSystemAdmin && !userProfile) {
    return loadingComponent
  }

  // If system admin, always allow access
  if (isSystemAdmin) {
    return <>{children}</>
  }

  // Check permission and render children if authorized
  if (hasPermission(resource, requiredPermission, tenant)) {
    return <>{children}</>
  }

  // Don't render anything while redirecting
  return null
} 