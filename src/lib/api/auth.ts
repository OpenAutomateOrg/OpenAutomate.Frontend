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
    try {
      console.log('Sending forgot password request for email:', data.email);
      
      // Send the request directly to the forgot password endpoint
      await api.post(endpoints.forgotPassword, data);
      
      console.log('Forgot password request sent successfully');
    } catch (error) {
      console.error('Forgot password request failed:', error);
      throw error;
    }
  },

  /**
   * Reset password with a token
   * @param data Token and new password
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    try {
      // Sanitize the request data
      const sanitizedData = {
        email: data.email.trim(),
        token: data.token.trim(),
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      };
      
      // Ensure token is in correct format
      if (sanitizedData.token.includes(' ')) {
        console.warn('Token contains spaces - cleaning up');
        sanitizedData.token = sanitizedData.token.replace(/\s/g, '');
      }
      
      // URL decode token if it's URL encoded
      try {
        if (sanitizedData.token.includes('%')) {
          const decodedToken = decodeURIComponent(sanitizedData.token);
          console.log('Token appears to be URL encoded - decoding');
          sanitizedData.token = decodedToken;
        }
      } catch (e) {
        console.warn('Error trying to decode token:', e);
        // Continue with original token if decoding fails
      }
      
      // Log the actual data being sent to API
      console.log('Sending reset password request with data:', {
        email: sanitizedData.email,
        tokenLength: sanitizedData.token.length,
        tokenPrefix: sanitizedData.token.substring(0, 10) + '...',
        newPassword: sanitizedData.newPassword ? '******' : 'MISSING', // Just log if it exists 
        confirmPassword: sanitizedData.confirmPassword ? '******' : 'MISSING', // Just log if it exists
      });
      
      // Debug log the full object structure
      console.log('Request payload structure:', JSON.stringify({
        ...sanitizedData,
        newPassword: '*****',
        confirmPassword: '*****',
      }, null, 2));
      
      const response = await api.post(endpoints.resetPassword, sanitizedData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Password reset request successful', response);
    } catch (error: any) {
      console.error('Reset password request failed with error:', error);
      
      // Enhanced error logging to diagnose the issue
      if (error?.status) {
        console.error('Status code:', error.status);
      }
      
      if (error?.message) {
        console.error('Error message:', error.message);
      }
      
      if (error?.details) {
        console.error('Error details:', error.details);
      }
      
      // Handle validation errors specially
      if (error?.errors) {
        console.error('Validation errors:', error.errors);
      }
      
      // Throw a more descriptive error
      if (error?.errors) {
        // Format validation errors
        const validationErrors = Object.entries(error.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
          
        throw new Error(`Password reset failed with validation errors: ${validationErrors}`);
      } else if (error?.message) {
        throw error;
      } else {
        throw new Error('Password reset failed. Please try again.');
      }
    }
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
