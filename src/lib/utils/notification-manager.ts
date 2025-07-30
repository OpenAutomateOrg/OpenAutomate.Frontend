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
  static error(message: string, options?: {
    title?: string
    duration?: number
    action?: ToastActionElement
  }) {
    if (!this.toastFunction) return

    this.toastFunction({
      title: options?.title || 'Error',
      description: message,
      variant: 'destructive',
      duration: options?.duration || 8000, // Longer for errors so users can read them
      action: options?.action
    })
  }

  /**
   * Show success notification with consistent styling and behavior
   */
  static success(message: string, options?: {
    title?: string
    duration?: number
    action?: ToastActionElement
  }) {
    if (!this.toastFunction) return

    this.toastFunction({
      title: options?.title || 'Success',
      description: message,
      variant: 'default',
      duration: options?.duration || 4000, // Shorter for success messages
      action: options?.action
    })
  }

  /**
   * Show warning notification with consistent styling and behavior
   */
  static warning(message: string, options?: {
    title?: string
    duration?: number
    action?: ToastActionElement
  }) {
    if (!this.toastFunction) return

    this.toastFunction({
      title: options?.title || 'Warning',
      description: message,
      variant: 'default',
      duration: options?.duration || 6000, // Medium duration for warnings
      action: options?.action
    })
  }

  /**
   * Show info notification with consistent styling and behavior
   */
  static info(message: string, options?: {
    title?: string
    duration?: number
    action?: ToastActionElement
  }) {
    if (!this.toastFunction) return

    this.toastFunction({
      title: options?.title || 'Information',
      description: message,
      variant: 'default',
      duration: options?.duration || 5000, // Medium duration for info
      action: options?.action
    })
  }

  /**
   * Smart error handler that determines error type and shows appropriate notification
   */
  static handleError(error: unknown, context?: string) {
    let message = 'An unexpected error occurred'
    let title = 'Error'

    // Extract error message using the same logic as before
    if (typeof error === 'string') {
      message = error
    } else if (error && typeof error === 'object') {
      // Handle API errors
      if ('status' in error && 'message' in error) {
        const apiError = error as { status: number; message: string }
        
        // Customize title based on status code
        switch (apiError.status) {
          case 400:
            title = 'Invalid Request'
            break
          case 401:
            title = 'Authentication Required'
            break
          case 403:
            title = 'Access Denied'
            break
          case 404:
            title = 'Not Found'
            break
          case 409:
            title = 'Conflict'
            break
          case 422:
            title = 'Validation Error'
            break
          case 429:
            title = 'Rate Limited'
            break
          case 500:
          case 502:
          case 503:
            title = 'Server Error'
            break
          default:
            title = 'Error'
        }
        
        message = apiError.message
      } else if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
        message = (error as { message: string }).message
      }
    }

    // Add context if provided
    if (context) {
      title = `${context} Failed`
    }

    this.error(message, { title })
  }

  /**
   * Handle success operations with consistent messaging
   */
  static handleSuccess(operation: string, itemName?: string) {
    const message = itemName 
      ? `${itemName} ${operation} successfully`
      : `${operation} completed successfully`
    
    this.success(message, {
      title: 'Success'
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
  handleSuccess: NotificationManager.handleSuccess.bind(NotificationManager)
}