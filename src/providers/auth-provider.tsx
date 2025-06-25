'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from 'react'
import { authApi } from '@/lib/api/auth'
import { useRouter } from 'next/navigation'
import { User, UserProfile, LoginRequest, RegisterRequest, SystemRole, PermissionLevel } from '@/types/auth'
import {
  getAuthToken,
  setAuthToken,
  getUser,
  setUser as setStoredUser,
  clearAuthData,
} from '@/lib/auth/token-storage'
import logger from '@/lib/utils/logger'
import authLogger from '@/lib/utils/auth-logger'
import { config } from '@/lib/config'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  isSystemAdmin: boolean
  login: (data: LoginRequest) => Promise<User | void>
  register: (data: RegisterRequest) => Promise<User>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  updateUser: (userData: Partial<User>) => void
  hasPermission: (resource: string, requiredPermission: PermissionLevel, tenant?: string) => boolean
  error: string | null
}

// Create the auth context
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Token refresh interval from config
const TOKEN_REFRESH_INTERVAL = config.auth.tokenRefreshInterval

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Computed property for system admin status
  const isSystemAdmin = user?.systemRole === SystemRole.Admin

  // Helper function to check permissions for a specific resource and tenant
  const hasPermission = useCallback((resource: string, requiredPermission: PermissionLevel, tenant?: string): boolean => {
    if (!userProfile) return false

    // System admins have all permissions
    if (isSystemAdmin) return true

    // Get current tenant from URL if not provided
    const currentTenant = tenant || window.location.pathname.split('/')[1]
    if (!currentTenant) return false

    // Find the organization unit by slug
    const orgUnit = userProfile.organizationUnits.find(ou => ou.slug === currentTenant)
    if (!orgUnit) return false

    // Find the resource permission
    const resourcePermission = orgUnit.permissions.find(p => p.resourceName === resource)
    if (!resourcePermission) return false

    // Check if user has required permission level or higher
    return resourcePermission.permission >= requiredPermission
  }, [userProfile, isSystemAdmin])

  // Refresh token implementation
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authApi.refreshToken()

      // Update token in storage
      setAuthToken(response.token)

      // Update user if it exists in the response
      const userToSet = response.user || {
        id: response.id,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        systemRole: response.systemRole || SystemRole.User,
      }

              // Update in storage and local state
        setStoredUser(userToSet)
        setUser(userToSet)

        // Fetch complete user profile with permissions after refresh
        try {
          const profile = await authApi.getUserProfile()
          setUserProfile(profile)
        } catch (profileError) {
          logger.warning('Failed to load user profile during refresh:', profileError)
        }

        logger.success('Token refreshed successfully')
        return true
    } catch (err) {
      logger.error('Token refresh failed:', err)
      // Clear auth data on refresh failure
      clearAuthData()
      setUser(null)
      setUserProfile(null)
      return false
    }
  }, [])

  // Set up token refresh on interval and tab focus
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null

    // Only set up refresh if user is authenticated
    if (user) {
      // Set up interval for token refresh
      refreshInterval = setInterval(() => {
        refreshToken()
      }, TOKEN_REFRESH_INTERVAL)

      // Set up focus event for token refresh
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          refreshToken()
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        if (refreshInterval) clearInterval(refreshInterval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [user, refreshToken])

  // Handle token expired events
  useEffect(() => {
    const handleTokenExpired = () => {
      logger.warning('Authentication token expired')
      clearAuthData()
      setUser(null)
      setUserProfile(null)
      router.push('/login')
    }

    window.addEventListener('auth:token-expired', handleTokenExpired)

    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpired)
    }
  }, [router])

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)

      try {
        // Check for stored token
        const token = getAuthToken()
        const userData = getUser()

        if (token && userData) {
          // If token and user exist, set user state
          setUser(userData)
          logger.log('User restored from storage', 'info', userData)

          // After setting user from storage, attempt to get fresh user data
          try {
            const currentUser = await authApi.getCurrentUser()
            setUser(currentUser)
            logger.success('User data refreshed from API')

            // Also fetch the complete profile with permissions
            try {
              const profile = await authApi.getUserProfile()
              setUserProfile(profile)
              logger.success('User profile refreshed from API')
            } catch (profileErr) {
              logger.warning('Failed to refresh user profile:', profileErr)
            }
          } catch (err) {
            logger.warning('Failed to get current user, attempting token refresh', err)
            // If fetching current user fails, try to refresh the token
            try {
              const response = await authApi.refreshToken()

              // Update token in storage
              setAuthToken(response.token)

              // Update user if it exists in the response
              const userToSet = response.user || {
                id: response.id,
                email: response.email,
                firstName: response.firstName,
                lastName: response.lastName,
                systemRole: response.systemRole || SystemRole.User,
              }

              // Update in storage and local state
              setStoredUser(userToSet)
              setUser(userToSet)

              // Fetch complete user profile with permissions
              try {
                const profile = await authApi.getUserProfile()
                setUserProfile(profile)
              } catch (profileError) {
                logger.warning('Failed to load user profile during init refresh:', profileError)
              }

              logger.success('Token refreshed successfully during init')
            } catch (refreshErr) {
              logger.error('Token refresh failed during init:', refreshErr)
              clearAuthData()
              setUser(null)
              setUserProfile(null)
            }
          }
        }
      } catch (err) {
        logger.error('Authentication initialization failed:', err)
        // Clear tokens if initialization fails
        clearAuthData()
        setUser(null)
        setUserProfile(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, []) // ✅ No dependencies to prevent infinite loop

  // Login function
  const login = useCallback(
    async (data: LoginRequest): Promise<User | void> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await authApi.login(data)

        // Store token and user
        setAuthToken(response.token)

        // Use user from response or create from response fields
        const userData = response.user || {
          id: response.id,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          systemRole: response.systemRole || SystemRole.User,
        }

        // Update in storage and local state
        setStoredUser(userData)
        setUser(userData)

        // Fetch complete user profile with permissions after login
        try {
          const profile = await authApi.getUserProfile()
          setUserProfile(profile)
          logger.success('User profile loaded with permissions')
        } catch (profileError) {
          logger.warning('Failed to load user profile, permissions may be limited:', profileError)
          // Don't fail login if profile fetch fails
        }

        // Log authentication success with standard logger
        logger.success(`User logged in: ${userData.email}`)

        // Always redirect to organization selector first
        // This lets the user choose which tenant to access
        router.push(config.paths.defaultRedirect)

        return userData
      } catch (err: unknown) {
        // Handle API error with type safety
        const errorMessage =
          typeof err === 'object' && err !== null
            ? (err as { response?: { data?: { message?: string } }; message?: string })?.response
                ?.data?.message ||
              (err as { message?: string })?.message ||
              'An error occurred during login'
            : 'An error occurred during login'

        setError(errorMessage)
        logger.error('Login failed:', err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [router],
  )

  // Register function
  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.register(data)

      // In email verification flow, we don't automatically log in the user
      // So we don't set tokens or user data here

      logger.auth('Registration Successful', {
        email: data.email,
        message: 'Verification email sent',
      })

      return response
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        const errorMessage = (err.message as string) || 'Registration failed'
        setError(errorMessage)
        logger.error('Registration failed:', errorMessage)
      } else {
        setError('Registration failed')
        logger.error('Registration failed: Unknown error')
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true)

    try {
      await authApi.logout()
      authLogger.logout()
    } catch (err) {
      logger.error('Logout error:', err)
    } finally {
      // Clear user and tokens
      clearAuthData()
      setUser(null)
      setUserProfile(null)
      router.push('/login')
      setIsLoading(false)
    }
  }, [router])

  // Update user function
  const updateUser = useCallback(
    (userData: Partial<User>) => {
      if (user) {
        const updatedUser = { ...user, ...userData }
        setUser(updatedUser)
        setStoredUser(updatedUser)
        logger.success('User data updated successfully')
      }
    },
    [user],
  )

  return (
    <AuthContext.Provider
      value={useMemo(
        () => ({
          user,
          userProfile,
          isLoading,
          isAuthenticated: !!user,
          isSystemAdmin,
          login,
          register,
          logout,
          refreshToken,
          updateUser,
          hasPermission,
          error,
        }),
        [user, userProfile, isLoading, isSystemAdmin, login, register, logout, refreshToken, updateUser, hasPermission, error],
      )}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context, deprecated - use the useAuth hook from hooks directory instead
export const useAuth = () => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
