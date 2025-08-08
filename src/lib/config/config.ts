/**
 * Central configuration settings for the application
 * Makes configuration values accessible throughout the app
 */

export const config = {
  /**
   * Application information
   */
  app: {
    /**
     * Application name
     */
    name: 'OpenAutomate Orchestrator',

    /**
     * Application URL - different for dev and production
     */
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001' /**
     * Production domain - used for cookies in production
     */,
    domain: process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost',
  },

  /**
   * API configuration
   */
  api: {
    /**
     * Base URL for API requests
     */
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5252',

    /**
     * Default headers for API requests
     */
    defaultHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
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
    userStorageKey: 'user_data',
  },

  /**
   * Download endpoints for client installers and tools
   */
  downloads: {
    /**
     * Public URL to download the desktop agent installer
     * Can be overridden via NEXT_PUBLIC_AGENT_DOWNLOAD_URL for different environments/domains
     */
    agentInstallerUrl:
      process.env.NEXT_PUBLIC_AGENT_DOWNLOAD_URL ||
      'https://openautomate-agent.s3.ap-southeast-1.amazonaws.com/OpenAutomate-Agent-Setup.exe',
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
      organizationSelector: '/tenant-selector',
    },

    /**
     * Default redirect after login
     */
    defaultRedirect: '/dashboard',
  },
}
