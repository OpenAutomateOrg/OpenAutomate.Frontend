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

    if (errorBody.message) {
      errorData.message = errorBody.message
      errorData.details = errorBody.message
    } else {
      errorData.details = JSON.stringify(errorBody)
    }
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
  // If it's already an ApiError (from our code), just rethrow it
  if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
    throw error;
  }

  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    const apiError: ApiError = {
      message: 'Network error. Please check your connection.',
      status: 0,
      details: error.message,
    }
    throw apiError
  }

  // For Error objects, preserve the message
  if (error instanceof Error) {
    const apiError: ApiError = {
      message: error.message,
      status: 0,
      details: error.stack,
    }
    throw apiError
  }

  throw error
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
  data?: unknown,
): Promise<T | null> => {
  // Skip token refresh for login and refresh-token endpoints
  if (endpoint.includes('refresh-token') || endpoint.includes('login')) {
    notifyTokenExpired()
    return null
  }

  try {
    const newToken = await refreshToken()
    if (!newToken) return null

    // Prepare the retry request properly with the new token
    const retryHeaders = prepareHeaders(options, data)
    retryHeaders.Authorization = `Bearer ${newToken}`

    // Use the same body preparation logic to avoid ArrayBuffer issues
    const { body } = prepareRequestBody(data)

    const retriedResponse = await fetch(url, {
      ...options,
      body, // Use properly prepared body
      headers: retryHeaders,
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
 * Prepare request body and headers for different data types
 */
const prepareRequestBody = <D>(data: D): { body: BodyInit | undefined; headers: Record<string, string> } => {
  if (!data) {
    return { body: undefined, headers: {} }
  }

  // Handle FormData - don't stringify and don't set any headers (browser will handle)
  if (data instanceof FormData) {
    return {
      body: data as BodyInit,
      headers: {} // No headers needed, browser will set multipart/form-data with boundary
    }
  }

  // Handle regular objects - stringify as JSON and set Content-Type
  return {
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  }
}

/**
 * Prepare request headers
 */
const prepareHeaders = (options: RequestInit, data?: unknown): Record<string, string> => {
  // Start with default headers, but exclude Content-Type if we're sending FormData
  const shouldExcludeContentType = data instanceof FormData
  const baseHeaders = shouldExcludeContentType
    ? { Accept: defaultHeaders.Accept } // Only include Accept header for FormData
    : { ...defaultHeaders }

  const headers = { ...baseHeaders, ...options.headers } as Record<string, string>

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
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}, data?: unknown): Promise<T> {
  const url = getFullUrl(endpoint)
  const headers = prepareHeaders(options, data)

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
      const refreshResult = await handle401Response<T>(endpoint, url, options, headers, data)
      if (refreshResult) {
        return refreshResult
      }
    }

    // For all other error responses, create and throw an API error
    const errorData = await createApiError(response)

    // Log error for debugging
    console.error(`API Error [${response.status}]:`, errorData.message);

    throw errorData
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
      // Nếu đã là ApiError, trả về ngay
      throw error;
    }
    return handleNetworkError(error)
  }
}

/**
 * HTTP request methods with proper typing
 */
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),

  post: <T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) => {
    const { body, headers: bodyHeaders } = prepareRequestBody(data)

    return fetchApi<T>(endpoint, {
      ...options,
      method: 'POST',
      body,
      headers: {
        ...bodyHeaders,
        ...options?.headers, // Allow options to override
      },
    }, data)
  },

  put: <T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) => {
    const { body, headers: bodyHeaders } = prepareRequestBody(data)

    return fetchApi<T>(endpoint, {
      ...options,
      method: 'PUT',
      body,
      headers: {
        ...bodyHeaders,
        ...options?.headers, // Allow options to override
      },
    }, data)
  },

  patch: <T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) => {
    const { body, headers: bodyHeaders } = prepareRequestBody(data)

    return fetchApi<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body,
      headers: {
        ...bodyHeaders,
        ...options?.headers, // Allow options to override
      },
    }, data)
  },

  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
}
