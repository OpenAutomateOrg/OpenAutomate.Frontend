import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Hook for managing URL query parameters
 */
export function useUrlParams() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPathname = usePathname()
  
  /**
   * Create a query string from parameters
   */
  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams?.toString() || '')
      
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newSearchParams.delete(key)
        } else {
          newSearchParams.set(key, value)
        }
      })
      
      return newSearchParams.toString()
    },
    [searchParams]
  )
  
  /**
   * Update URL with new query parameters without triggering navigation
   */
  const updateUrl = useCallback(
    (pathname: string | null, params: Record<string, string | null>) => {
      // Use provided pathname or fall back to current pathname
      const path = pathname || currentPathname || '/'
      const queryString = createQueryString(params)
      router.push(`${path}?${queryString}`, { scroll: false })
    },
    [createQueryString, router, currentPathname]
  )
  
  return {
    createQueryString,
    updateUrl,
  }
} 