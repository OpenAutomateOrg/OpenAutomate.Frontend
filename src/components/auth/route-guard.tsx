'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/providers/auth-provider'
import { Icons } from '@/components/ui/icons'

interface RouteGuardProps {
  children: React.ReactNode
}

// Paths that don't require authentication
const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password']

export function RouteGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, isLoading, refreshToken } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Check if the route is protected
    const requiresAuth = !publicPaths.includes(pathname)

    // Authentication check
    const checkAuth = async () => {
      if (!isAuthenticated && requiresAuth) {
        // Try refreshing the token first (in case it's just expired)
        const refreshed = await refreshToken()
        
        if (!refreshed) {
          // If still not authenticated after refresh attempt, redirect to login
          setAuthorized(false)
          router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`)
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
      <div className="flex min-h-screen items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  // If on a public path or authenticated, render children
  return authorized ? <>{children}</> : null
} 