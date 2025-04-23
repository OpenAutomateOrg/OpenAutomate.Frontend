import { api } from './client'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '@/types/auth'

/**
 * Authentication API functions
 */
export const authApi = {
  /**
   * Log in an existing user
   */
  login: (data: LoginRequest) => api.post<AuthResponse>('api/auth/login', data),

  /**
   * Register a new user
   */
  register: (data: RegisterRequest) => api.post<AuthResponse>('api/auth/register', data),

  /**
   * Get the current user profile
   */
  getCurrentUser: () => api.get<User>('api/users/current'),

  /**
   * Refresh the access token using a refresh token
   */
  refreshToken: (data: RefreshTokenRequest) =>
    api.post<AuthResponse>('api/auth/refresh-token', data),

  /**
   * Log out the current user
   */
  logout: () => api.post('api/auth/logout', {}),

  /**
   * Send a forgot password email
   */
  forgotPassword: (data: ForgotPasswordRequest) => api.post('api/auth/forgot-password', data),

  /**
   * Reset password with a token
   */
  resetPassword: (data: ResetPasswordRequest) => api.post('api/auth/reset-password', data),

  /**
   * Change the current user's password
   */
  changePassword: (data: ChangePasswordRequest) => api.post('api/users/change-password', data),
}
