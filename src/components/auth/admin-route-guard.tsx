'use client'

import { useAuth } from '@/providers/auth-provider'
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
  const { isSystemAdmin, isLoading, isLogout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect after loading completes and we know user is not an admin
    if (!isLoading && !isSystemAdmin) {
      router.push(redirectPath)
    } else if (isLogout) {
      router.push('/login')
    }
  }, [isSystemAdmin, isLoading, router, redirectPath, isLogout])

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

  // If user is admin, show the protected content
  return isSystemAdmin ? <>{children}</> : null
}
