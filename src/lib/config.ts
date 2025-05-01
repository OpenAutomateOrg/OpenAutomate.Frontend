/**
 * Central configuration settings for the application
 * Makes configuration values accessible throughout the app
 */

export const config = {
  /**
   * API configuration
   */
  api: {
    /**
     * Base URL for API requests
     */
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5252',
    
    /**
     * Default headers for API requests
     */
    defaultHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  
  /**
   * Authentication configuration
   */
  auth: {
    /**
     * Token refresh interval in milliseconds (14 minutes)
     */
    tokenRefreshInterval: 14 * 60 * 1000,
    
    /**
     * Token storage key in localStorage
     */
    tokenStorageKey: 'auth_token',
    
    /**
     * User data storage key in localStorage
     */
    userStorageKey: 'user_data'
  },
  
  /**
   * URL paths
   */
  paths: {
    /**
     * Authentication-related paths
     */
    auth: {
      login: '/login',
      register: '/register',
      forgotPassword: '/forgot-password',
      resetPassword: '/reset-password',
      verificationPending: '/verification-pending',
      emailVerified: '/email-verified',
      verifyEmail: '/verify-email',
      organizationSelector: '/organization-selector'
    },
    
    /**
     * Default redirect after login
     */
    defaultRedirect: '/organization-selector'
  }
} 