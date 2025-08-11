'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { config } from '@/lib/config/config'

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, isSystemAdmin } = useAuth()
  useEffect(() => {
    // Only redirect after loading is complete to check authentication status
    if (!isLoading) {
      if (isSystemAdmin) {
        router.push('/dashboard')
      } else if (isAuthenticated) {
        router.push(config.paths.defaultRedirect)
      } else {
        // User is not authenticated, redirect to login
        router.push(config.paths.auth.login)
      }
    }
  }, [isLoading, isAuthenticated, router, isSystemAdmin])

  // Display a minimal loading screen while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <h1 className="text-xl font-medium">{config.app.name}</h1>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
