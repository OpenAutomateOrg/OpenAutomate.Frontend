'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrganizationUnits } from '@/hooks/use-organization-units'
import { useAuth } from '@/hooks/use-auth'

interface TenantGuardProps {
  children: React.ReactNode
}

export function TenantGuard({ children }: TenantGuardProps) {
  const { tenant } = useParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { organizationUnits, isLoading: orgLoading } = useOrganizationUnits()
  const [isValidating, setIsValidating] = useState(true)

  useEffect(() => {
    // Don't validate until we have all the data
    if (authLoading || orgLoading) {
      return
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // If no tenant in URL, redirect to tenant selector
    if (!tenant) {
      router.push('/tenant-selector')
      return
    }

    // Check if user has access to this tenant
    const hasAccess = organizationUnits.some((org) => org.slug === tenant)

    if (!hasAccess) {
      // User doesn't have access to this tenant
      console.warn(`User attempted to access unauthorized tenant: ${tenant}`)

      // Redirect to tenant selector with a force parameter to prevent auto-redirect
      router.push('/tenant-selector?force=true&unauthorized=true')
      return
    }

    // All validations passed
    setIsValidating(false)
  }, [tenant, isAuthenticated, authLoading, organizationUnits, orgLoading, router])

  // Show loading while validating
  if (authLoading || orgLoading || isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Validating access...</p>
        </div>
      </div>
    )
  }

  // Render children if validation passed
  return <>{children}</>
}
