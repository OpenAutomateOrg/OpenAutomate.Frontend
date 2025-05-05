/**
 * Token storage utilities
 * Implements a memory-first approach with localStorage fallback for resilience
 */

// Import user type
import type { User } from '@/types/auth'
import { config } from '@/lib/config'

// Storage keys from config
const TOKEN_KEY = config.auth.tokenStorageKey
const USER_KEY = config.auth.userStorageKey

// In-memory storage (more secure than localStorage)
let inMemoryToken: string | null = null
let inMemoryUser: User | null = null

/**
 * Gets the authentication token, prioritizing in-memory storage
 */
export const getAuthToken = (): string | null => {
  // First check in-memory token (more secure, not persisted)
  if (inMemoryToken) {
    return inMemoryToken
  }

  // Then check localStorage as fallback (only on client-side)
  if (typeof window !== 'undefined') {
    try {
      // Try to get from localStorage (for page refreshes)
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (storedToken) {
        // Save back to memory for future use
        inMemoryToken = storedToken
        return storedToken
      }
    } catch (e) {
      // Handle localStorage access issues (e.g., private browsing mode)
      console.error('Error accessing localStorage', e)
    }
  }

  return null
}

/**
 * Sets the authentication token, prioritizing in-memory storage
 */
export const setAuthToken = (token: string | null): void => {
  // Always update in-memory token
  inMemoryToken = token

  // Update localStorage for persistence through refreshes
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token)
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
    } catch (e) {
      // Handle localStorage access issues
      console.error('Error accessing localStorage', e)
    }
  }
}

/**
 * Gets the stored user data
 */
export const getUser = (): User | null => {
  // First check in-memory
  if (inMemoryUser) {
    return inMemoryUser
  }

  // Then check localStorage as fallback
  if (typeof window !== 'undefined') {
    try {
      const storedUser = localStorage.getItem(USER_KEY)
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as User
          // Save back to memory
          inMemoryUser = parsedUser
          return parsedUser
        } catch (e) {
          console.error('Error parsing stored user data', e)
          return null
        }
      }
    } catch (e) {
      console.error('Error accessing localStorage', e)
    }
  }

  return null
}

/**
 * Sets the user data
 */
export const setUser = (user: User | null): void => {
  // Update in-memory
  inMemoryUser = user

  // Update localStorage
  if (typeof window !== 'undefined') {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(USER_KEY)
      }
    } catch (e) {
      console.error('Error accessing localStorage', e)
    }
  }
}

/**
 * Clears all authentication data
 */
export const clearAuthData = (): void => {
  // Clear memory
  inMemoryToken = null
  inMemoryUser = null

  // Clear localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch (e) {
      console.error('Error accessing localStorage', e)
    }
  }
}
