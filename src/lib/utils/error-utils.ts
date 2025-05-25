/**
 * Utility functions for handling API errors and extracting user-friendly messages
 */

interface ApiError {
    message: string
  status: number
  details?: string
}

/**
 * Tries to parse JSON details from API error
 */
function parseApiErrorDetails(details: string): string | null {
  try {
    const parsedDetails = JSON.parse(details)
    return parsedDetails.error || parsedDetails.message || null
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
  return apiError.message || 'An error occurred'
}

/**
 * Extracts message from generic object with error/message properties
 */
function extractObjectErrorMessage(errorObj: Record<string, unknown>): string | null {
  if (errorObj.error && typeof errorObj.error === 'string') {
    return errorObj.error
  }
  if (errorObj.message && typeof errorObj.message === 'string') {
    return errorObj.message
  }
  return null
}

/**
 * Checks if error is an API error object
 */
function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'details' in error && 'status' in error
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
    return extractApiErrorMessage(error)
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object') {
    const message = extractObjectErrorMessage(error as Record<string, unknown>)
    if (message) {
      return message
    }
  }

  return 'An unexpected error occurred'
}

/**
 * Determines the appropriate toast variant based on error type
 */
export function getErrorVariant(error: unknown): 'destructive' | 'default' {
  if (typeof error === 'object' && error && 'status' in error) {
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