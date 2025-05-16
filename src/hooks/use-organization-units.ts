'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { organizationUnitApi } from '@/lib/api/organization-units'
import { OrganizationUnit } from '@/types/organization'
import { useRouter } from 'next/navigation'

// Cache time in milliseconds (5 seconds)
const CACHE_TIME = 5000

export function useOrganizationUnits() {
  const [organizationUnits, setOrganizationUnits] = useState<OrganizationUnit[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Using refs to track fetch state without causing re-renders
  const fetchingRef = useRef(false)
  const lastFetchTimeRef = useRef(0)
  const initialFetchDoneRef = useRef(false)

  const fetchOrganizationUnits = useCallback(async (force = false) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      return
    }

    // Return cached data if within cache time and not forced
    const now = Date.now()
    if (!force && lastFetchTimeRef.current > 0 && now - lastFetchTimeRef.current < CACHE_TIME) {
      return
    }

    try {
      fetchingRef.current = true
      setIsLoading(true)
      setError(null)
      
      lastFetchTimeRef.current = Date.now() // Update timestamp before fetch

      const response = await organizationUnitApi.getMyOrganizationUnits()
      setOrganizationUnits(response.organizationUnits || [])
    } catch (err: unknown) {
      console.error('Failed to fetch organization units:', err)
      
      let errorMessage = 'Failed to fetch organization units. Please try again later.'
      
      // Extract more specific error message if available
      if (err && typeof err === 'object') {
        const errObj = err as Record<string, unknown>
        if (errObj.message && typeof errObj.message === 'string') {
          errorMessage = errObj.message
        } else if (errObj.details && typeof errObj.details === 'string') {
          errorMessage = errObj.details
        }
        
        // Check if it's a network or authorization error
        if (errObj.status === 0) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (errObj.status === 401) {
          errorMessage = 'You are not authorized to access organization units. Please log in again.'
          // Optionally redirect to login page
          // router.push('/login')
        }
      }
      
      setError(errorMessage)
      setOrganizationUnits([]) // Clear data on error
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
      initialFetchDoneRef.current = true
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      fetchOrganizationUnits()
    }
  }, [fetchOrganizationUnits])

  const selectOrganizationUnit = useCallback(
    (slug: string) => {
      router.push(`/${slug}/dashboard`)
    },
    [router],
  )

  return {
    organizationUnits,
    isLoading,
    error,
    refresh: () => fetchOrganizationUnits(true), // Force refresh
    selectOrganizationUnit,
  }
}
