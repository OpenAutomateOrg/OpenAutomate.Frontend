'use client'

import { useEffect } from 'react'
import { setupAutoErrorHandling, cleanupAutoErrorHandling } from '@/lib/utils/auto-error-handler'

interface AutoErrorProviderProps {
  children: React.ReactNode
}

/**
 * Provider that sets up automatic error handling for unhandled promise rejections
 * This ensures that any API errors that components forget to handle will still be shown to users
 */
export function AutoErrorProvider({ children }: AutoErrorProviderProps) {
  useEffect(() => {
    // Set up automatic error handling when the app loads
    setupAutoErrorHandling()

    // Clean up when the component unmounts
    return () => {
      cleanupAutoErrorHandling()
    }
  }, [])

  return <>{children}</>
}
