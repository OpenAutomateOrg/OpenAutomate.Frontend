import { api } from './client'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  UserProfile,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  ChangeUserNameRequest,
} from '@/types/auth'

// API endpoints for authentication
const endpoints = {
  login: 'api/authen/login',
  register: 'api/authen/register',
  user: 'api/authen/user',
  profile: 'api/account/profile',
  refreshToken: 'api/authen/refresh-token',
  revokeToken: 'api/authen/revoke-token',
  forgotPassword: 'api/authen/forgot-password',
  resetPassword: 'api/authen/reset-password',
  changeUserName: 'api/user/user',
  changePassword: 'api/user/change-password',
  resendVerification: 'api/email/resend',
  resendVerificationByEmail: 'api/email/resend-public',
  verifyEmail: 'api/email/verify',
}

interface ApiError {
  status?: number
  message?: string
  details?: string
  errors?: Record<string, string | string[]>
}

/**
 * Sanitizes and formats a token string
 */
function sanitizeToken(token: string): string {
  let sanitizedToken = token.trim()

  // Remove spaces
  if (sanitizedToken.includes(' ')) {
    console.warn('Token contains spaces - cleaning up')
    sanitizedToken = sanitizedToken.replace(/\s/g, '')
  }

  // Try URL decoding if needed
  try {
    if (sanitizedToken.includes('%')) {
      console.log('Token appears to be URL encoded - decoding')
      return decodeURIComponent(sanitizedToken)
    }
  } catch (e) {
    console.warn('Error trying to decode token:', e)
  }

  return sanitizedToken
}

/**
 * Logs API error details and throws appropriate error
 */
function handleResetPasswordError(error: unknown): never {
  console.error('Reset password request failed with error:', error)

  const apiError = error as ApiError

  // Log error details
  if (apiError?.status) console.error('Status code:', apiError.status)
  if (apiError?.message) console.error('Error message:', apiError.message)
  if (apiError?.details) console.error('Error details:', apiError.details)
  if (apiError?.errors) console.error('Validation errors:', apiError.errors)

  // Handle validation errors
  if (apiError?.errors) {
    const validationErrors = formatValidationErrors(apiError.errors)
    throw new Error(`Password reset failed with validation errors: ${validationErrors}`)
  }

  if (apiError?.message) throw apiError
  throw new Error('Password reset failed. Please try again.')
}

/**
 * Formats validation errors into a readable string
 */
function formatValidationErrors(errors: Record<string, string | string[]>): string {
  return Object.entries(errors)
    .map(
      ([field, messages]) =>
        `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`,
    )
    .join('; ')
}

/**
 * Authentication API service
 * Handles all authentication-related API calls
 */
export const authApi = {
  /**
   * Log in an existing user
   * @param data Login credentials
   * @returns Authentication response with token and user data
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(endpoints.login, data, {
      credentials: 'include', // Include cookies for refresh token
    })
    return response
  },

  /**
   * Register a new user
   * @param data Registration data including email, password, name
   * @returns Response with user data
   */
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<{ user: User; message: string }>(endpoints.register, data, {
      credentials: 'include',
    })
    return response.user
  },

  /**
   * Get the current user profile
   * @returns User profile data
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>(endpoints.user)
    return response
  },

  /**
   * Get the complete user profile with permissions across all organization units
   * @returns Complete user profile with permissions
   */
  getUserProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(endpoints.profile)
    return response
  },

  /**
   * Refresh the access token using the HTTP-only cookie refresh token
   * @returns New authentication tokens and user data
   */
  refreshToken: async (): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(
      endpoints.refreshToken,
      {},
      {
        credentials: 'include',
      },
    )
    return response
  },

  /**
   * Log out the current user by revoking the refresh token
   */
  logout: async (): Promise<void> => {
    await api.post(
      endpoints.revokeToken,
      {},
      {
        credentials: 'include',
      },
    )
  },

  /**
   * Send a forgot password email
   * @param data Email address for password reset
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    try {
      console.log('Sending forgot password request for email:', data.email)

      // Send the request directly to the forgot password endpoint
      await api.post(endpoints.forgotPassword, data)

      console.log('Forgot password request sent successfully')
    } catch (error) {
      console.error('Forgot password request failed:', error)
      throw error
    }
  },

  /**
   * Reset password with a token
   * @param data Token and new password
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    try {
      // Prepare sanitized data
      const sanitizedData = {
        email: data.email.trim(),
        token: sanitizeToken(data.token.trim()),
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      }

      // Log request data (masked for security)
      console.log('Sending reset password request with data:', {
        email: sanitizedData.email,
        tokenLength: sanitizedData.token.length,
        tokenPrefix: sanitizedData.token.substring(0, 10) + '...',
        newPassword: sanitizedData.newPassword ? '******' : 'MISSING',
        confirmPassword: sanitizedData.confirmPassword ? '******' : 'MISSING',
      })

      // Debug log the full structure (with passwords masked)
      console.log(
        'Request payload structure:',
        JSON.stringify(
          {
            ...sanitizedData,
            newPassword: '*****',
            confirmPassword: '*****',
          },
          null,
          2,
        ),
      )

      // Send the request
      const response = await api.post(endpoints.resetPassword, sanitizedData, {
        headers: { 'Content-Type': 'application/json' },
      })

      console.log('Password reset request successful', response)
    } catch (error: unknown) {
      handleResetPasswordError(error)
    }
  },

  /**
   * Change the current user's name
   * @param data First Name and new Last Name
   */
  changeUserName: async (id: string, data: ChangeUserNameRequest): Promise<void> => {
    await api.put(endpoints.changeUserName, data)
  },

  /**
   * Change the current user's password
   * @param data Current and new password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post(endpoints.changePassword, data)
  },

  /**
   * Resend verification email to a registered user (requires authentication)
   * @param email User's email address
   */
  resendVerificationEmail: async (email: string): Promise<void> => {
    await api.post(endpoints.resendVerification, { email })
  },

  /**
   * Resend verification email by email address (does not require authentication)
   * @param email User's email address
   */
  resendVerificationEmailByEmail: async (email: string): Promise<void> => {
    await api.post(endpoints.resendVerificationByEmail, { email })
  },

  /**
   * Verify email with token
   * @param token Email verification token
   * @returns Success status
   */
  verifyEmail: async (token: string): Promise<boolean> => {
    try {
      await api.get(`${endpoints.verifyEmail}?token=${token}`)
      return true
    } catch (error) {
      console.error('Verification failed', error)
      return false
    }
  },
}
