'use client'

import { handleGlobalError } from './global-error-handler'

/**
 * Set up automatic error handling for all unhandled promise rejections
 * This catches errors that components forgot to handle properly
 */
export function setupAutoErrorHandling() {
  if (typeof window === 'undefined') return

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    // Check if this is an API error that should be shown to the user
    const error = event.reason

    // Only handle API errors, not other types of errors
    if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
      // Skip 401 errors as they are handled by auth flow
      if ((error as { status: number }).status === 401) {
        return
      }

      // Prevent the default browser console error
      event.preventDefault()

      // Show the error to the user
      handleGlobalError(error)
    }
  })

  // Optional: Handle regular JavaScript errors if needed
  window.addEventListener('error', () => {
    // We can add additional error handling here if needed
    // For now, we only focus on API errors via promise rejections
  })
}

/**
 * Clean up error handling (useful for testing)
 */
export function cleanupAutoErrorHandling() {
  if (typeof window === 'undefined') return

  // Remove event listeners
  window.removeEventListener('unhandledrejection', () => {})
  window.removeEventListener('error', () => {})
}
