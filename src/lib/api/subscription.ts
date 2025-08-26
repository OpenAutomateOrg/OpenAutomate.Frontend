import { api } from './client'
import type { SubscriptionStatus, StartTrialResponse } from '@/types/subscription'

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
    listPayments: `${tenant}/api/subscription/payments`,
    viewInvoice: (orderId: string) => `${tenant}/api/subscription/payments/${orderId}/view`,
    checkout: `${tenant}/api/subscription/checkout`,
    customerPortal: `${tenant}/api/subscription/customer-portal`,
  }
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

export interface PaymentItem {
  orderId: string
  amount: number
  currency: string
  status: string
  paymentDate: string
  isRefunded: boolean
  receiptUrl?: string | null
}

export interface PagedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export const getPayments = async (page = 1, pageSize = 25): Promise<PagedResult<PaymentItem>> => {
  const endpoints = createEndpoints()
  const url = `${endpoints.listPayments}?page=${page}&pageSize=${pageSize}`
  return api.get<PagedResult<PaymentItem>>(url)
}

export const openInvoice = (orderId: string): void => {
  const endpoints = createEndpoints()
  if (typeof window !== 'undefined') {
    window.open(`${endpoints.viewInvoice(orderId)}`, '_blank', 'noopener,noreferrer')
  }
}

export interface CheckoutResponse {
  checkoutUrl: string
  organizationUnitId: string
  userEmail: string
}

export interface CustomerPortalResponse {
  url: string
  organizationUnitId: string
}

export const getCheckoutUrl = async (redirectUrl?: string): Promise<CheckoutResponse> => {
  const endpoints = createEndpoints()
  const url = redirectUrl
    ? `${endpoints.checkout}?redirectUrl=${encodeURIComponent(redirectUrl)}`
    : endpoints.checkout
  return api.get<CheckoutResponse>(url)
}

export const openCheckout = async (redirectTo: string = 'subscription/success'): Promise<void> => {
  const absUrl = ((): string => {
    if (typeof window === 'undefined') return redirectTo
    if (/^https?:\/\//i.test(redirectTo)) return redirectTo
    const origin = window.location.origin
    const tenantSeg = getCurrentTenant()
    const path = redirectTo.replace(/^\//, '')
    return `${origin}/${tenantSeg}/${path}`
  })()
  const { checkoutUrl } = await getCheckoutUrl(absUrl)
  if (typeof window !== 'undefined') {
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
  }
}

// Opens Lemon Squeezy overlay when lemon.js is available; otherwise falls back to new tab
// Pass redirectTo to send users straight to Orchestrator after payment
export const openCheckoutOverlay = async (
  redirectTo: string = 'subscription/success',
): Promise<void> => {
  if (typeof window === 'undefined') return

  // Build absolute redirect URL per-tenant
  const absUrl = (() => {
    if (/^https?:\/\//i.test(redirectTo)) return redirectTo
    const origin = window.location.origin
    const tenantSeg = getCurrentTenant()
    const path = redirectTo.replace(/^\//, '')
    return `${origin}/${tenantSeg}/${path}`
  })()

  const { checkoutUrl } = await getCheckoutUrl(absUrl)

  const appendEmbedParam = (url: string): string => {
    try {
      const u = new URL(url)
      if (!u.searchParams.has('embed')) {
        u.searchParams.set('embed', '1')
      }
      return u.toString()
    } catch {
      // Fallback if URL constructor fails
      const hasQuery = checkoutUrl.includes('?')
      const hasEmbed = /[?&]embed=1(&|$)/.test(checkoutUrl)
      return hasEmbed ? checkoutUrl : `${checkoutUrl}${hasQuery ? '&' : '?'}embed=1`
    }
  }

  const urlWithEmbed = appendEmbedParam(checkoutUrl)

  // Helper: poll subscription until it becomes active, then redirect
  let redirected = false
  const stopPolling = (() => {
    const maxMs = 2 * 60 * 1000 // 2 minutes
    const start = Date.now()
    const id = window.setInterval(async () => {
      if (Date.now() - start > maxMs || redirected) {
        window.clearInterval(id)
        return
      }
      try {
        const s = await getSubscriptionStatus()
        if (s?.isActive) {
          redirected = true
          window.clearInterval(id)
          window.location.replace(absUrl)
        }
      } catch {
        // ignore transient errors while polling
      }
    }, 2000)
    return () => window.clearInterval(id)
  })()

  // Listen for Lemon Squeezy overlay success event and hard-redirect to success page
  type LemonEvent = { event?: string } | string | unknown
  const onMessage = (e: MessageEvent<LemonEvent>) => {
    try {
      const payload = e?.data
      let eventName: string | undefined
      if (typeof payload === 'string') {
        // Some integrations send string events
        eventName = payload
      } else if (typeof payload === 'object' && payload !== null) {
        eventName = (payload as { event?: string }).event
      }
      if (
        eventName === 'Checkout.Success' ||
        (typeof eventName === 'string' && /Success/i.test(eventName))
      ) {
        window.removeEventListener('message', onMessage)
        redirected = true
        stopPolling()
        window.location.replace(absUrl)
      }
    } catch {
      // no-op
    }
  }
  window.addEventListener('message', onMessage)
  // Safety cleanup after 10 minutes
  window.setTimeout(
    () => {
      window.removeEventListener('message', onMessage)
      stopPolling()
    },
    10 * 60 * 1000,
  )

  const waitForLemonJs = async (timeoutMs = 8000): Promise<boolean> => {
    const start = Date.now()
    return new Promise((resolve) => {
      const tick = () => {
        const w = window as unknown as { LemonSqueezy?: unknown }
        if (w.LemonSqueezy) return resolve(true)
        if (Date.now() - start >= timeoutMs) return resolve(false)
        setTimeout(tick, 50)
      }
      tick()
    })
  }

  const hasLemon = await waitForLemonJs()
  if (!hasLemon) {
    // Open hosted checkout in a new tab, but keep polling on this page and
    // keep the cleanup timer + message listener in case we still get events.
    window.open(urlWithEmbed, '_blank', 'noopener,noreferrer')
    return
  }

  const link = document.createElement('a')
  link.href = urlWithEmbed
  link.className = 'lemonsqueezy-button'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    link.remove()
    // If overlay closes without success event, polling continues as fallback
  }, 0)
}

export const getCustomerPortalUrl = async (): Promise<CustomerPortalResponse> => {
  const endpoints = createEndpoints()
  return api.get<CustomerPortalResponse>(endpoints.customerPortal)
}

export const openCustomerPortal = async (): Promise<void> => {
  const { url } = await getCustomerPortalUrl()
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

// Export all subscription API functions
export const subscriptionApi = {
  getSubscriptionStatus,
  startTrial,
  getPayments,
  openInvoice,
  getCheckoutUrl,
  openCheckout,
  openCheckoutOverlay,
  getCustomerPortalUrl,
  openCustomerPortal,
}
