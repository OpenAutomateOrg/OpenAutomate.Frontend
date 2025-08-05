'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface AdminRouteGuardProps {
  /**
   * The content to be protected by the admin route guard
   */
  children: ReactNode

  /**
   * The path to redirect non-admin users to
   * @default "/tenant-selector"
   */
  redirectPath?: string

  /**
   * Custom loading component
   * @default A basic skeleton loader
   */
  loadingComponent?: ReactNode
}

/**
 * Component that protects routes by allowing only system administrators to access them
 * @param props Component props
 * @returns The children if user is admin, otherwise redirects to the dashboard
 */
export function AdminRouteGuard({
  children,
  redirectPath = '/tenant-selector',
  loadingComponent,
}: AdminRouteGuardProps) {
  const { isSystemAdmin, isLoading, isLogout, isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return

    // Handle logout state
    if (isLogout) {
      router.push('/login')
      return
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // If authenticated but not a system admin, redirect to tenant selector
    if (isAuthenticated && user && !isSystemAdmin) {
      console.warn('Non-admin user attempting to access admin route:', {
        userId: user.id,
        email: user.email,
        systemRole: user.systemRole,
      })
      router.push(redirectPath)
    }
  }, [isSystemAdmin, isLoading, router, redirectPath, isLogout, isAuthenticated, user])

  // If still loading, show loading component
  if (isLoading) {
    return (
      loadingComponent || (
        <div className="w-full p-8 space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-60 w-full rounded-lg" />
          <Skeleton className="h-12 w-2/3 rounded-lg" />
        </div>
      )
    )
  }

  // If user is authenticated and is a system admin, show the protected content
  return isAuthenticated && isSystemAdmin ? <>{children}</> : null
}
