import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Hook for managing URL query parameters
 */
export function useUrlParams() {
  const router = useRouter()
  const searchParams = useSearchParams()

  /**
   * Create a query string from parameters
   */
  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString())

      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newSearchParams.delete(key)
        } else {
          newSearchParams.set(key, value)
        }
      })

      return newSearchParams.toString()
    },
    [searchParams],
  )
  /**
   * Update URL with new query parameters without triggering navigation
   */
  const updateUrl = useCallback(
    (pathname: string, params: Record<string, string | null>) => {
      const queryString = createQueryString(params)
      router.push(`${pathname}?${queryString}`, { scroll: false })
    },
    [createQueryString, router],
  )

  return {
    createQueryString,
    updateUrl,
  }
}
