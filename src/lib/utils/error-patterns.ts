/**
 * Standardized error handling patterns for consistent UI/UX
 * Following real-world best practices from companies like GitHub, Linear, Vercel
 */

import { notify } from './notification-manager'

/**
 * Common error handling patterns with consistent messaging
 */
export const ErrorPatterns = {
  /**
   * Handle CRUD operations with consistent success/error messaging
   */
  handleCrudOperation: async <T>(
    operation: () => Promise<T>,
    config: {
      operation: 'create' | 'update' | 'delete' | 'fetch'
      resourceName: string
      onSuccess?: (result: T) => void
      onError?: (error: unknown) => void
    }
  ): Promise<T | null> => {
    const { operation: op, resourceName } = config
    
    try {
      const result = await operation()
      
      // Show success message
      const actionMap = {
        create: 'created',
        update: 'updated', 
        delete: 'deleted',
        fetch: 'loaded'
      }
      
      if (op !== 'fetch') {
        notify.handleSuccess(actionMap[op], resourceName)
      }
      
      config.onSuccess?.(result)
      return result
    } catch (error) {
      // Show error message with context
      const contextMap = {
        create: `Creating ${resourceName}`,
        update: `Updating ${resourceName}`,
        delete: `Deleting ${resourceName}`,
        fetch: `Loading ${resourceName}`
      }
      
      notify.handleError(error, contextMap[op])
      config.onError?.(error)
      return null
    }
  },

  /**
   * Handle form submissions with validation and API errors
   */
  handleFormSubmission: async <T>(
    submitFunction: () => Promise<T>,
    config: {
      formName: string
      onSuccess?: (result: T) => void
      onValidationError?: (error: unknown) => void
      successMessage?: string
    }
  ): Promise<T | null> => {
    try {
      const result = await submitFunction()
      
      if (config.successMessage) {
        notify.success(config.successMessage)
      } else {
        notify.success(`${config.formName} submitted successfully`)
      }
      
      config.onSuccess?.(result)
      return result
    } catch (error) {
      // Check if it's a validation error (400)
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status: number }
        if (apiError.status === 400) {
          config.onValidationError?.(error)
          // Let the notification manager handle it with proper context
          notify.handleError(error, `${config.formName} validation`)
          return null
        }
      }
      
      notify.handleError(error, `Submitting ${config.formName}`)
      return null
    }
  },

  /**
   * Handle data fetching with loading states
   */
  handleDataFetch: async <T>(
    fetchFunction: () => Promise<T>,
    config: {
      resourceName: string
      showSuccessMessage?: boolean
      onSuccess?: (result: T) => void
      onError?: (error: unknown) => void
    }
  ): Promise<T | null> => {
    try {
      const result = await fetchFunction()
      
      if (config.showSuccessMessage) {
        notify.success(`${config.resourceName} loaded successfully`)
      }
      
      config.onSuccess?.(result)
      return result
    } catch (error) {
      notify.handleError(error, `Loading ${config.resourceName}`)
      config.onError?.(error)
      return null
    }
  },

  /**
   * Handle batch operations with progress feedback
   */
  handleBatchOperation: async <T>(
    operations: Array<() => Promise<T>>,
    config: {
      operationName: string
      resourceName: string
      onProgress?: (completed: number, total: number) => void
      onComplete?: (results: T[]) => void
    }
  ): Promise<T[]> => {
    const results: T[] = []
    const errors: unknown[] = []
    
    for (let i = 0; i < operations.length; i++) {
      try {
        const result = await operations[i]()
        results.push(result)
        config.onProgress?.(i + 1, operations.length)
      } catch (error) {
        errors.push(error)
        notify.handleError(error, `${config.operationName} ${config.resourceName} ${i + 1}`)
      }
    }
    
    // Summary message
    if (errors.length === 0) {
      notify.success(`All ${config.resourceName} ${config.operationName} successfully`)
    } else if (results.length > 0) {
      notify.warning(
        `${results.length} of ${operations.length} ${config.resourceName} ${config.operationName} successfully. ${errors.length} failed.`
      )
    } else {
      notify.error(`Failed to ${config.operationName} any ${config.resourceName}`)
    }
    
    config.onComplete?.(results)
    return results
  }
}

/**
 * Convenience functions for common operations
 */
export const handleCreate = <T>(resourceName: string) => 
  (operation: () => Promise<T>) => 
    ErrorPatterns.handleCrudOperation(operation, { 
      operation: 'create', 
      resourceName 
    })

export const handleUpdate = <T>(resourceName: string) => 
  (operation: () => Promise<T>) => 
    ErrorPatterns.handleCrudOperation(operation, { 
      operation: 'update', 
      resourceName 
    })

export const handleDelete = <T>(resourceName: string) => 
  (operation: () => Promise<T>) => 
    ErrorPatterns.handleCrudOperation(operation, { 
      operation: 'delete', 
      resourceName 
    })

export const handleFetch = <T>(resourceName: string) => 
  (operation: () => Promise<T>) => 
    ErrorPatterns.handleCrudOperation(operation, { 
      operation: 'fetch', 
      resourceName 
    })