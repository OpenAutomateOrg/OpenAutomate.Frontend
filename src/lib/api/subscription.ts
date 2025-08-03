import { api } from './client'
import type {
  SubscriptionStatus,
  StartTrialResponse,
  CheckoutResponse,
  CheckoutRequest,
  CustomerPortalResponse,
} from '@/types/subscription'

/**
 * Get current tenant from URL
 */
const getCurrentTenant = (): string => {
  if (typeof window === 'undefined') return ''
  const path = window.location.pathname
  const segments = path.split('/').filter(Boolean)
  return segments.length > 0 ? segments[0] : ''
}

/**
 * Get the current subscription status for the tenant
 */
export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const endpoints = createEndpoints()
  return api.get<SubscriptionStatus>(endpoints.status)
}

/**
 * Start a trial subscription for the current user and tenant
 */
export const startTrial = async (): Promise<StartTrialResponse> => {
  const endpoints = createEndpoints()
  return api.post<StartTrialResponse>(endpoints.startTrial, {})
}

/**
 * Get checkout URL for a specific plan
 */
export const getCheckoutUrl = async (options?: {
  redirectUrl?: string
  tenant?: string
}): Promise<string> => {
  const tenant = options?.tenant || getCurrentTenant()
  if (!tenant) {
    throw new Error('No tenant context available')
  }

  const requestData: CheckoutRequest = {
    tenant,
    ...(options?.redirectUrl && { redirectUrl: options.redirectUrl }),
  }

  const response = await api.post<CheckoutResponse>(
    `${tenant}/api/Subscription/checkout`,
    requestData,
  )
  return response.checkoutUrl
}

/**
 * Get customer portal URL for subscription management
 */
export const getCustomerPortalUrl = async (): Promise<CustomerPortalResponse> => {
  const endpoints = createEndpoints()
  return api.get<CustomerPortalResponse>(endpoints.customerPortal)
}

/**
 * Create tenant-aware API endpoints
 */
const createEndpoints = () => {
  const tenant = getCurrentTenant()
  if (!tenant) {
    throw new Error('No tenant context available')
  }

  return {
    status: `${tenant}/api/subscription/status`,
    startTrial: `${tenant}/api/subscription/start-trial`,
    customerPortal: `${tenant}/api/subscription/customer-portal`,
  }
}

// Export all subscription API functions
export const subscriptionApi = {
  getSubscriptionStatus,
  startTrial,
  getCheckoutUrl,
  getCustomerPortalUrl,
}
