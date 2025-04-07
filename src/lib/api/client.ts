/**
 * API client for the OpenAutomate backend
 * Uses the environment variable NEXT_PUBLIC_API_URL for the API base URL
 */

type ApiError = {
  message: string;
  status: number;
  details?: string;
};

// Default API URL - fallback to localhost in development
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5252';

// Default request headers
const defaultHeaders = {
  'Content-Type': 'application/json',
};

/**
 * Generic function to make API requests
 */
export async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_URL}/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Include cookies for authentication
  });

  // Handle error responses
  if (!response.ok) {
    const errorData: ApiError = {
      message: response.statusText,
      status: response.status,
    };

    try {
      // Try to parse error details from response
      const errorBody = await response.json();
      errorData.details = errorBody.message || JSON.stringify(errorBody);
    } catch (e) {
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
  return await response.json() as T;
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
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  put: <T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) => 
    fetchApi<T>(endpoint, { 
      ...options, 
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  patch: <T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) => 
    fetchApi<T>(endpoint, { 
      ...options, 
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  delete: <T>(endpoint: string, options?: RequestInit) => 
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
}; 