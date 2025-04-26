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

/**
 * Authentication API functions
 */
export const authApi = {
  /**
   * Log in an existing user
   * Endpoint: POST /api/authen/login
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('api/authen/login', data, {
      credentials: 'include', // Include cookies for refresh token
    });
    return response;
  },

  /**
   * Register a new user
   * Endpoint: POST /api/authen/register
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('api/authen/register', data, {
      credentials: 'include', // Include cookies for refresh token
    });
    return response;
  },

  /**
   * Get the current user profile
   * Endpoint: GET /api/authen/user
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('api/authen/user');
    return response;
  },

  /**
   * Refresh the access token using the HTTP-only cookie refresh token
   * Endpoint: POST /api/authen/refresh-token
   */
  refreshToken: async (): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('api/authen/refresh-token', {}, {
      credentials: 'include', // Include cookies for refresh token
    });
    return response;
  },

  /**
   * Log out the current user by revoking the refresh token
   * Endpoint: POST /api/authen/revoke-token
   */
  logout: async (): Promise<void> => {
    await api.post('api/authen/revoke-token', {}, {
      credentials: 'include', // Include cookies for refresh token
    });
  },

  /**
   * Send a forgot password email
   * Endpoint: POST /api/authen/forgot-password
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await api.post('api/authen/forgot-password', data);
  },

  /**
   * Reset password with a token
   * Endpoint: POST /api/authen/reset-password
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await api.post('api/authen/reset-password', data);
  },

  /**
   * Change the current user's password
   * Endpoint: POST /api/users/change-password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post('api/users/change-password', data);
  },
}
