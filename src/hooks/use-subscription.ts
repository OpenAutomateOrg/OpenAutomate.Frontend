'use client'

import useSWR from 'swr'
import { subscriptionApi } from '@/lib/api/subscription'
import { swrKeys, createSWRErrorMessage } from '@/lib/config/swr-config'

export function useSubscription() {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.subscription(),
    () => subscriptionApi.getSubscriptionStatus(),
    {
      // Revalidate more frequently for subscription status
      refreshInterval: 30000, // 30 seconds
      revalidateOnFocus: true,
    }
  )

  return {
    subscription: data || null,
    isLoading,
    error: error ? createSWRErrorMessage(error) : null,
    mutate,
  }
}