'use client'

import { useMemo, useEffect } from 'react'
import { SWRConfig } from 'swr'
import { createSWRConfig, defaultSWRConfig } from '@/lib/config/swr-config'
import { setGlobalToastFunction } from '@/lib/utils/global-error-handler'
import { useToast } from '@/components/ui/use-toast'

interface SWRProviderProps {
  children: React.ReactNode
}

/**
 * Client-side SWR provider component
 * This needs to be a client component because SWR requires browser APIs
 * Creates SWR configuration with toast error handling
 */
export function SWRProvider({ children }: SWRProviderProps) {
  const { toast } = useToast()

  // Set up the global toast function when the provider mounts
  useEffect(() => {
    if (toast) {
      setGlobalToastFunction(toast)
    }
  }, [toast])

  // Create SWR configuration
  const swrConfig = useMemo(() => {
    if (toast) {
      return createSWRConfig()
    } else {
      return defaultSWRConfig
    }
  }, [toast])

  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
}
