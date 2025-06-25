'use client'

import { useCallback } from 'react'
import { organizationUnitApi } from '@/lib/api/organization-units'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { swrKeys } from '@/lib/swr-config'

export function useOrganizationUnits() {
  const router = useRouter()

  // SWR for data fetching - replaces 60+ lines of manual caching and state management
  const { data, error, isLoading, mutate } = useSWR(swrKeys.organizationUnits(), () =>
    organizationUnitApi.getMyOrganizationUnits().then((r) => r.organizationUnits),
  )
  const selectOrganizationUnit = useCallback(
    (slug: string) => {
      router.push(`/${slug}/dashboard`)
    },
    [router],
  )

  return {
    organizationUnits: data ?? [],
    isLoading,
    error: error ? 'Failed to fetch organization units. Please try again later.' : null,
    refresh: mutate,
    selectOrganizationUnit,
  }
}
