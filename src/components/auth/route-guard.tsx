'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Icons } from '@/components/ui/icons'
import { config } from '@/lib/config/config'

interface RouteGuardProps {
  readonly children: React.ReactNode
}

// Paths that don't require authentication from the config
const publicPaths = [
  config.paths.auth.login,
  config.paths.auth.register,
  config.paths.auth.forgotPassword,
  config.paths.auth.resetPassword,
  config.paths.auth.verificationPending,
  config.paths.auth.emailVerified,
  config.paths.auth.verifyEmail,
]

// Paths that require authentication but don't require organization context
// const authOnlyPaths = [
//   config.paths.auth.organizationSelector
// ]

export function RouteGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, isLoading, refreshToken } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Check if the route is protected
    const requiresAuth = !publicPaths.includes(pathname)
    // Check if the route requires organization context
    // const requiresAuthOnly = authOnlyPaths.includes(pathname)

    // Authentication check
    const checkAuth = async () => {
      if (!isAuthenticated && requiresAuth) {
        // Try refreshing the token first (in case it's just expired)
        const refreshed = await refreshToken()

        if (!refreshed) {
          // If still not authenticated after refresh attempt, redirect to login
          setAuthorized(false)
          router.push(`${config.paths.auth.login}?returnUrl=${encodeURIComponent(pathname)}`)
        } else {
          setAuthorized(true)
        }
      } else {
        setAuthorized(true)
      }
    }

    // When not loading, check authentication
    if (!isLoading) {
      checkAuth()
    }
  }, [isAuthenticated, isLoading, pathname, refreshToken, router])

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="mx-auto flex h-full w-full flex-col items-center justify-center">
        <Icons.Spinner className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  // If on a public path or authenticated, render children
  return authorized ? <>{children}</> : null
}
