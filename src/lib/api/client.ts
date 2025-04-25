/**
 * API client for the OpenAutomate backend
 * Uses the environment variable NEXT_PUBLIC_API_URL for the API base URL
 */

// Import browser-safe localStorage utility
import { getAuthToken, setAuthToken } from '@/lib/auth/token-storage';

type ApiError = {
  message: string;
  status: number;
  details?: string;
};

// Default API URL - fallback to localhost in development
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5252";

// Default request headers
const defaultHeaders = {
  "Content-Type": "application/json",
  "Accept": "application/json"
};

// Keep track of if we're currently refreshing the token
let isRefreshing = false;
// Queue of requests waiting for token refresh
let failedQueue: { resolve: Function; reject: Function }[] = [];

// Helper to process the queue of pending requests
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Attempt to refresh the authentication token
 */
const refreshToken = async (): Promise<string | null> => {
  // If already refreshing, wait for the current refresh to complete
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const response = await fetchApi<{ token: string }>('api/authen/refresh-token', {
      method: 'POST',
      credentials: 'include', // Include cookies for the refresh token
    });

    const newToken = response.token;
    setAuthToken(newToken);
    processQueue(null, newToken);
    return newToken;
  } catch (error) {
    processQueue(error as Error);
    throw error;
  } finally {
    isRefreshing = false;
  }
};

/**
 * Generic function to make API requests
 */
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL}/${endpoint.startsWith("/") ? endpoint.slice(1) : endpoint}`;

  // Add authorization header if token exists and not already set
  const headers = { ...defaultHeaders, ...options.headers } as Record<string, string>;
  
  if (!headers.Authorization) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Include cookies for authentication
    });

    // Handle error responses
    if (!response.ok) {
      if (response.status === 401) {
        // Only attempt token refresh if not already trying to refresh
        if (!endpoint.includes('refresh-token') && !endpoint.includes('login')) {
          try {
            const newToken = await refreshToken();
            if (newToken) {
              // Retry the original request with the new token
              headers.Authorization = `Bearer ${newToken}`;
              const retriedResponse = await fetch(url, {
                ...options,
                headers,
                credentials: "include",
              });
              
              if (retriedResponse.ok) {
                if (retriedResponse.status === 204) {
                  return {} as T;
                }
                return (await retriedResponse.json()) as T;
              }
            }
          } catch (refreshError) {
            // If refresh fails, dispatch token expired event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('auth:token-expired'));
            }
            console.error('Token refresh failed:', refreshError);
          }
        } else {
          // If we're already trying to refresh or login and get a 401, we're truly unauthorized
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:token-expired'));
          }
        }
      }

      const errorData: ApiError = {
        message: response.statusText,
        status: response.status,
      };

      try {
        // Try to parse error details from response
        const errorBody = await response.json();
        errorData.details = errorBody.message || JSON.stringify(errorBody);
      } catch {
        // If parsing fails, use status text
        errorData.details = response.statusText;
      }

      throw errorData;
    }

    // Return empty object for 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }

    // Parse JSON response
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw {
        message: 'Network error. Please check your connection.',
        status: 0,
        details: error.message
      } as ApiError;
    }
    throw error;
  }
}

/**
 * HTTP request methods with proper typing
 */
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: "GET" }),

  post: <T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: "DELETE" }),
};
