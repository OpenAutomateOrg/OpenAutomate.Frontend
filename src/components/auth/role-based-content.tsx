'use client'

import { useAuth } from '@/providers/auth-provider'
import { SystemRole } from '@/types/auth'
import { ReactNode } from 'react'

interface RoleBasedContentProps {
  /**
   * Content to display for admin users
   */
  adminContent: ReactNode

  /**
   * Content to display for standard users
   */
  userContent: ReactNode

  /**
   * Optional fallback content for unauthenticated users
   */
  fallback?: ReactNode
}

/**
 * Component that conditionally renders content based on user's system role
 * @param props Component props
 * @returns The appropriate content based on user's role
 */
export function RoleBasedContent({
  adminContent,
  userContent,
  fallback = null,
}: RoleBasedContentProps) {
  const { user, isLoading } = useAuth()

  // Show fallback while loading or if user isn't authenticated
  if (isLoading || !user) return fallback

  // Render content based on user's system role
  return user.systemRole === SystemRole.Admin ? adminContent : userContent
}
