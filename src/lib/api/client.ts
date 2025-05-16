/**
 * API client for the OpenAutomate backend
 * Uses the environment variable NEXT_PUBLIC_API_URL for the API base URL
 */

// Import browser-safe localStorage utility
import { getAuthToken, setAuthToken } from '@/lib/auth/token-storage'
import { config } from '@/lib/config'

type ApiError = {
  message: string
  status: number
  details?: string
}

// Default request headers from configuration
const defaultHeaders = config.api.defaultHeaders

// Keep track of if we're currently refreshing the token
let isRefreshing = false
// Queue of requests waiting for token refresh
let failedQueue: { resolve: (token: string | null) => void; reject: (error: Error) => void }[] = []

// Helper to process the queue of pending requests
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token)
    }
  })
  failedQueue = []
}

/**
 * Create API error object from response
 */
const createApiError = async (response: Response): Promise<ApiError> => {
  const errorData: ApiError = {
    message: response.statusText,
    status: response.status,
  }

  try {
    // Try to parse error details from response
    const errorBody = await response.json()
    errorData.details = errorBody.message || JSON.stringify(errorBody)
  } catch {
    // If parsing fails, use status text
    errorData.details = response.statusText
  }

  return errorData
}

/**
 * Notify the app about token expiration
 */
const notifyTokenExpired = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:token-expired'))
  }
}

/**
 * Handle network errors
 */
const handleNetworkError = (error: unknown): never => {
  // Create a standardized error object
  const apiError: ApiError = {
    message: 'Network error. Please check your connection.',
    status: 0,
    details: error instanceof Error ? error.message : String(error),
  }
  
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    throw apiError;
  } else if (error instanceof Error) {
    apiError.message = error.message;
    throw apiError;
  } else {
    // For unknown error types
    throw apiError;
  }
}

/**
 * Process successful response
 */
const processSuccessResponse = async <T>(response: Response): Promise<T> => {
  // Return empty object for 204 No Content responses
  if (response.status === 204) {
    return {} as T
  }

  // Parse JSON response
  return (await response.json()) as T
}

/**
 * Attempt to refresh the authentication token
 */
const refreshToken = async (): Promise<string | null> => {
  // If already refreshing, wait for the current refresh to complete
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    })
  }

  isRefreshing = true

  try {
    const response = await fetchApi<{ token: string }>('api/authen/refresh-token', {
      method: 'POST',
      credentials: 'include', // Include cookies for the refresh token
    })

    const newToken = response.token
    setAuthToken(newToken)
    processQueue(null, newToken)
    return newToken
  } catch (error) {
    processQueue(error as Error)
    throw error
  } finally {
    isRefreshing = false
  }
}

/**
 * Handle 401 unauthorized response
 */
const handle401Response = async <T>(
  endpoint: string,
  url: string,
  options: RequestInit,
  headers: Record<string, string>,
): Promise<T | null> => {
  // Skip token refresh for login and refresh-token endpoints
  if (endpoint.includes('refresh-token') || endpoint.includes('login')) {
    notifyTokenExpired()
    return null
  }

  try {
    const newToken = await refreshToken()
    if (!newToken) return null

    // Retry the original request with the new token
    headers.Authorization = `Bearer ${newToken}`
    const retriedResponse = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })

    if (retriedResponse.ok) {
      return processSuccessResponse<T>(retriedResponse)
    }
    return null
  } catch (refreshError) {
    notifyTokenExpired()
    console.error('Token refresh failed:', refreshError)
    return null
  }
}

/**
 * Get full API URL
 */
const getFullUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http')) {
    return endpoint
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${config.api.baseUrl}/${cleanEndpoint}`
}

/**
 * Prepare request headers
 */
const prepareHeaders = (options: RequestInit): Record<string, string> => {
  const headers = { ...defaultHeaders, ...options.headers } as Record<string, string>

  if (!headers.Authorization) {
    const token = getAuthToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  return headers
}

/**
 * Generic function to make API requests
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = getFullUrl(endpoint)
  const headers = prepareHeaders(options)

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for authentication
    })

    // Handle successful responses
    if (response.ok) {
      return processSuccessResponse<T>(response)
    }

    // Handle 401 Unauthorized responses
    if (response.status === 401) {
      const refreshResult = await handle401Response<T>(endpoint, url, options, headers)
      if (refreshResult) {
        return refreshResult
      }
    }

    // For all other error responses, create and throw an API error
    const errorData = await createApiError(response)
    throw errorData
  } catch (error) {
    return handleNetworkError(error)
  }
}

/**
 * HTTP request methods with proper typing
 */
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),

  post: <T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
}
