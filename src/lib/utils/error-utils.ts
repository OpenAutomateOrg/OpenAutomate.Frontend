/**
 * Utility functions for handling API errors and extracting user-friendly messages
 */

interface ApiError {
    message: string
  status: number
  details?: string
}

/**
 * Extracts a user-friendly error message from various error formats
 */
export function extractErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (!error) {
    return 'An unexpected error occurred'
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  // Handle API errors from our client
  if (typeof error === 'object' && 'details' in error && 'status' in error) {
    const apiError = error as ApiError
    
    try {
      // Try to parse the details as JSON (backend error response)
      const parsedDetails = JSON.parse(apiError.details || '{}')
      if (parsedDetails.error) {
        return parsedDetails.error
      }
      if (parsedDetails.message) {
        return parsedDetails.message
      }
    } catch {
      // If parsing fails, use details as-is
      if (apiError.details) {
        return apiError.details
      }
    }
    
    return apiError.message || 'An error occurred'
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message
  }

  // Handle objects with error or message properties
  if (typeof error === 'object') {
    const errorObj = error as Record<string, unknown>
    
    if (errorObj.error && typeof errorObj.error === 'string') {
      return errorObj.error
    }
    
    if (errorObj.message && typeof errorObj.message === 'string') {
      return errorObj.message
    }
  }

  // Fallback
  return 'An unexpected error occurred'
}

/**
 * Determines the appropriate toast variant based on error type
 */
export function getErrorVariant(error: unknown): 'destructive' | 'default' {
  if (typeof error === 'object' && error && 'status' in error) {
    const apiError = error as ApiError
    // Use destructive for client errors (4xx) and server errors (5xx)
    if (apiError.status >= 400) {
      return 'destructive'
    }
  }
  
  return 'destructive' // Default to destructive for errors
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