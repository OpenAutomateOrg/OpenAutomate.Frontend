/**
 * Utility functions for handling API errors and extracting user-friendly messages
 */

import type { ApiError } from '@/lib/api/client'
import type { ToastType } from '@/components/ui/use-toast'

/**
 * Tries to parse JSON details from API error
 */
function parseApiErrorDetails(details: string): string | null {
  try {
    const parsedDetails = JSON.parse(details)
    return parsedDetails.error ?? parsedDetails.message ?? null
  } catch {
    return null
  }
}

/**
 * Extracts message from API error object
 */
function extractApiErrorMessage(apiError: ApiError): string {
  if (apiError.details) {
    const parsedMessage = parseApiErrorDetails(apiError.details)
    if (parsedMessage) {
      return parsedMessage
    }
    return apiError.details
  }
  return apiError.message ?? 'An error occurred'
}

/**
 * Extracts message from generic object with error/message properties
 */
function extractObjectErrorMessage(errorObj: Record<string, unknown>): string | null {
  if (
    errorObj.error !== undefined &&
    errorObj.error !== null &&
    typeof errorObj.error === 'string'
  ) {
    return errorObj.error
  }
  if (
    errorObj.message !== undefined &&
    errorObj.message !== null &&
    typeof errorObj.message === 'string'
  ) {
    return errorObj.message
  }
  return null
}

/**
 * Extracts message from Axios error response
 */
function extractAxiosErrorMessage(error: unknown): string | null {
  if (
    error !== null &&
    typeof error === 'object' &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response
  ) {
    const responseData = error.response.data

    // Check for message in response data
    if (typeof responseData === 'object' && responseData !== null) {
      if ('message' in responseData && typeof responseData.message === 'string') {
        return responseData.message
      }
      if ('error' in responseData && typeof responseData.error === 'string') {
        return responseData.error
      }
    }

    // If response data is a string itself
    if (typeof responseData === 'string') {
      return responseData
    }
  }

  return null
}

/**
 * Checks if error is an API error object
 */
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error &&
    typeof (error as ApiError).status === 'number' &&
    typeof (error as ApiError).message === 'string'
  )
}

/**
 * Extracts a user-friendly error message from various error formats
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred'
  }

  if (typeof error === 'string') {
    return error
  }

  if (isApiError(error)) {
    // Handle network errors (status 0) specially
    if (error.status === 0) {
      return error.message || 'Network error. Please check your connection.'
    }
    return extractApiErrorMessage(error)
  }

  if (error instanceof Error) {
    // Handle common network error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'Network error. Please check your connection.'
    }
    return error.message
  }

  // Check for Axios error format
  const axiosErrorMessage = extractAxiosErrorMessage(error)
  if (axiosErrorMessage !== null) {
    return axiosErrorMessage
  }

  if (typeof error === 'object' && error !== null) {
    const message = extractObjectErrorMessage(error as Record<string, unknown>)
    if (message !== null) {
      return message
    }
  }

  return 'An unexpected error occurred'
}

/**
 * Determines the appropriate toast variant based on error type
 */
export function getErrorVariant(error: unknown): 'destructive' | 'default' {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const apiError = error as ApiError
    // Use default for informational responses (1xx, 2xx, 3xx)
    if (apiError.status < 400) {
      return 'default'
    }
    // Use destructive for client errors (4xx) and server errors (5xx)
    return 'destructive'
  }

  // For non-API errors, check if it's a simple string warning vs actual error
  if (typeof error === 'string') {
    const lowercaseError = error.toLowerCase()
    if (lowercaseError.includes('warning') || lowercaseError.includes('info')) {
      return 'default'
    }
  }

  // Default to destructive for unknown errors
  return 'destructive'
}

/**
 * Creates a standardized error toast configuration
 */
export function createErrorToast(error: unknown) {
  const message = extractErrorMessage(error)
  const variant = getErrorVariant(error)

  return {
    title: 'Error',
    description: message,
    variant,
  }
}

/**
 * Creates and displays an error toast notification
 * This function is meant to be used with the actual toast hook
 */
export function showErrorToast(error: unknown, toastFn: (props: ToastType) => void) {
  const toastConfig = createErrorToast(error)
  toastFn(toastConfig)
}
