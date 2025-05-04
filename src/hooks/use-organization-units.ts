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
      
      const response = await organizationUnitApi.getMyOrganizationUnits()
      setOrganizationUnits(response.organizationUnits)
      
      // Update timestamp
      lastFetchTimeRef.current = Date.now()
    } catch (err) {
      console.error('Failed to fetch organization units:', err)
      setError('Failed to fetch organization units. Please try again later.')
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

  const selectOrganizationUnit = useCallback((slug: string) => {
    router.push(`/${slug}/dashboard`)
  }, [router])

  return {
    organizationUnits,
    isLoading,
    error,
    refresh: () => fetchOrganizationUnits(true), // Force refresh
    selectOrganizationUnit
  }
} 