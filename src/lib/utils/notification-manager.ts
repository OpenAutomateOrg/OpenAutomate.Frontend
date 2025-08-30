import type { ToastType } from '@/components/ui/use-toast'
import type { ToastActionElement } from '@/components/ui/toast'

/**
 * Centralized notification manager for consistent error/success handling
 * Following real-world best practices from companies like GitHub, Linear, Vercel
 */
export class NotificationManager {
  private static toastFunction: ((props: ToastType) => void) | null = null

  /**
   * Set the toast function (called by the toast provider)
   */
  static setToastFunction(toastFn: (props: ToastType) => void) {
    this.toastFunction = toastFn
  }

  /**
   * Show error notification with consistent styling and behavior
   */
  static error(
    message: string,
    options?: {
      title?: string
      duration?: number
      action?: ToastActionElement
    },
  ) {
    if (!this.toastFunction) return

    this.toastFunction({
      title: options?.title || 'Error',
      description: message,
      variant: 'destructive',
      duration: options?.duration || 8000, // Longer for errors so users can read them
      action: options?.action,
    })
  }

  /**
   * Show success notification with consistent styling and behavior
   */
  static success(
    message: string,
    options?: {
      title?: string
      duration?: number
      action?: ToastActionElement
    },
  ) {
    if (!this.toastFunction) return

    this.toastFunction({
      title: options?.title || 'Success',
      description: message,
      variant: 'success',
      duration: options?.duration || 4000, // Shorter for success messages
      action: options?.action,
    })
  }

  /**
   * Show warning notification with consistent styling and behavior
   */
  static warning(
    message: string,
    options?: {
      title?: string
      duration?: number
      action?: ToastActionElement
    },
  ) {
    if (!this.toastFunction) return

    this.toastFunction({
      title: options?.title || 'Warning',
      description: message,
      variant: 'warning',
      duration: options?.duration || 6000, // Medium duration for warnings
      action: options?.action,
    })
  }

  /**
   * Show info notification with consistent styling and behavior
   */
  static info(
    message: string,
    options?: {
      title?: string
      duration?: number
      action?: ToastActionElement
    },
  ) {
    if (!this.toastFunction) return

    this.toastFunction({
      title: options?.title || 'Information',
      description: message,
      variant: 'default',
      duration: options?.duration || 5000, // Medium duration for info
      action: options?.action,
    })
  }

  /**
   * Extract error details from different error types
   */
  private static extractErrorDetails(error: unknown): { message: string; title: string } {
    let message = 'An unexpected error occurred'
    let title = 'Error'

    if (typeof error === 'string') {
      return { message: error, title }
    }

    if (error && typeof error === 'object') {
      if ('status' in error && 'message' in error) {
        const apiError = error as { status: number; message: string }
        title = this.getTitleByStatus(apiError.status)
        message =
          apiError.status === 403
            ? 'You do not have permission to perform this action'
            : apiError.message
      } else if (
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
      ) {
        message = (error as { message: string }).message
      }
    }

    return { message, title }
  }

  /**
   * Get appropriate title based on HTTP status code
   */
  private static getTitleByStatus(status: number): string {
    switch (status) {
      case 400:
        return 'Invalid Request'
      case 401:
        return 'Authentication Required'
      case 403:
        return 'Permission Denied'
      case 404:
        return 'Not Found'
      case 409:
        return 'Conflict'
      case 422:
        return 'Validation Error'
      case 429:
        return 'Rate Limited'
      case 500:
      case 502:
      case 503:
        return 'Server Error'
      default:
        return 'Error'
    }
  }

  /**
   * Smart error handler that determines error type and shows appropriate notification
   */
  static handleError(error: unknown, context?: string) {
    const { message, title: baseTitle } = this.extractErrorDetails(error)

    // Add context if provided
    const title = context
      ? `${context.charAt(0).toUpperCase() + context.slice(1)} Failed`
      : baseTitle

    this.error(message, { title })
  }

  /**
   * Handle success operations with consistent messaging
   */
  static handleSuccess(operation: string, itemName?: string) {
    // Capitalize first letter of operation for proper message formatting
    const capitalizedOperation = operation.charAt(0).toUpperCase() + operation.slice(1)

    const message = itemName
      ? `${itemName} ${operation} successfully`
      : `${capitalizedOperation} completed successfully`

    this.success(message, {
      title: 'Success',
    })
  }

  /**
   * Check if notification system is available
   */
  static isAvailable(): boolean {
    return this.toastFunction !== null
  }
}

/**
 * Convenience functions for common use cases
 */
export const notify = {
  error: NotificationManager.error.bind(NotificationManager),
  success: NotificationManager.success.bind(NotificationManager),
  warning: NotificationManager.warning.bind(NotificationManager),
  info: NotificationManager.info.bind(NotificationManager),
  handleError: NotificationManager.handleError.bind(NotificationManager),
  handleSuccess: NotificationManager.handleSuccess.bind(NotificationManager),
}
