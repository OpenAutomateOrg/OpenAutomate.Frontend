'use client'

import { useContext } from 'react'
import { AuthContext } from '@/providers/auth-provider'

/**
 * Custom hook for accessing authentication context
 *
 * Provides access to:
 * - Current user
 * - Authentication state
 * - Auth-related functions (login, logout, register)
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
