'use client'

import { NotificationManager } from './notification-manager'
import type { ToastType } from '@/components/ui/use-toast'

// Global toast function that will be set by the app
let globalToastFunction: ((props: ToastType) => void) | null = null

/**
 * Set the global toast function for error handling
 * This should be called when the app initializes
 */
export function setGlobalToastFunction(toastFn: (props: ToastType) => void) {
  globalToastFunction = toastFn
  NotificationManager.setToastFunction(toastFn)
}

/**
 * Global error handler that shows user-friendly toast notifications
 * Can be used anywhere in the app for consistent error handling
 */
export function handleGlobalError(error: unknown, options?: { 
  skipToast?: boolean 
  skipAuth?: boolean 
  context?: string
}) {
  // Skip toast if explicitly requested
  if (options?.skipToast) {
    return
  }

  // Skip 401 errors if requested (they usually trigger auth flow)
  if (options?.skipAuth !== false) {
    const isApiError = error && typeof error === 'object' && 'status' in error
    if (isApiError && (error as { status: number }).status === 401) {
      return
    }
  }

  // Use the new notification manager for consistent error handling
  NotificationManager.handleError(error, options?.context)
}

/**
 * Wrapper for fetchApi that automatically handles errors with toast notifications
 * Use this instead of direct fetchApi calls for better user experience
 */
export async function safeFetchApi<T>(
  endpoint: string,
  options?: RequestInit,
  data?: unknown
): Promise<T | null> {
  try {
    const { fetchApi } = await import('@/lib/api/client')
    return await fetchApi<T>(endpoint, options, data)
  } catch (error) {
    handleGlobalError(error)
    return null
  }
}

/**
 * Check if global toast function is available
 */
export function isGlobalToastAvailable(): boolean {
  return globalToastFunction !== null
}