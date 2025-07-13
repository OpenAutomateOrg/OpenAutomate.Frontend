'use client'

import { SWRConfig } from 'swr'
import { swrConfig } from '@/lib/swr-config'

interface SWRProviderProps {
  children: React.ReactNode
}

/**
 * Client-side SWR provider component
 * This needs to be a client component because SWR requires browser APIs
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
}
