import { api } from './client'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '@/types/auth'

// API endpoints for authentication
const endpoints = {
  login: 'api/authen/login',
  register: 'api/authen/register',
  user: 'api/authen/user',
  refreshToken: 'api/authen/refresh-token',
  revokeToken: 'api/authen/revoke-token',
  forgotPassword: 'api/authen/forgot-password',
  resetPassword: 'api/authen/reset-password',
  changePassword: 'api/users/change-password',
  resendVerification: 'api/email/resend',
  verifyEmail: 'api/email/verify',
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
    await api.post(endpoints.forgotPassword, data)
  },

  /**
   * Reset password with a token
   * @param data Token and new password
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await api.post(endpoints.resetPassword, data)
  },

  /**
   * Change the current user's password
   * @param data Current and new password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post(endpoints.changePassword, data)
  },

  /**
   * Resend verification email to a registered user
   * @param email User's email address
   */
  resendVerificationEmail: async (email: string): Promise<void> => {
    await api.post(endpoints.resendVerification, { email })
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
