'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { authApi } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import {
  User,
  LoginRequest,
  RegisterRequest,
  SystemRole,
} from "@/types/auth";
import {
  getAuthToken,
  setAuthToken,
  getUser,
  setUser as setStoredUser,
  clearAuthData,
} from "@/lib/auth/token-storage";
import logger from "@/lib/utils/logger";
import authLogger from "@/lib/utils/auth-logger";
import { config } from "@/lib/config";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSystemAdmin: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  error: string | null;
}

// Create the auth context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token refresh interval from config
const TOKEN_REFRESH_INTERVAL = config.auth.tokenRefreshInterval;

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Computed property for system admin status
  const isSystemAdmin = user?.systemRole === SystemRole.Admin;

  // Refresh token implementation
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authApi.refreshToken();
      
      // Update token in storage
      setAuthToken(response.token);
      
      // Update user if it exists in the response
      const userToSet = response.user || {
        id: response.id,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        systemRole: response.systemRole || SystemRole.User
      };
      
      // Update in storage and local state
      setStoredUser(userToSet);
      setUser(userToSet);
      logger.success("Token refreshed successfully");
      return true;
    } catch (err) {
      logger.error("Token refresh failed:", err);
      // Clear auth data on refresh failure
      clearAuthData();
      setUser(null);
      return false;
    }
  }, []);

  // Set up token refresh on interval and tab focus
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;

    // Only set up refresh if user is authenticated
    if (user) {
      // Set up interval for token refresh
      refreshInterval = setInterval(() => {
        refreshToken();
      }, TOKEN_REFRESH_INTERVAL);

      // Set up focus event for token refresh
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          refreshToken();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        if (refreshInterval) clearInterval(refreshInterval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [user, refreshToken]);

  // Handle token expired events
  useEffect(() => {
    const handleTokenExpired = () => {
      logger.warning("Authentication token expired");
      clearAuthData();
      setUser(null);
      router.push("/login");
    };

    window.addEventListener("auth:token-expired", handleTokenExpired);

    return () => {
      window.removeEventListener("auth:token-expired", handleTokenExpired);
    };
  }, [router]);

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)

      try {
        // Check for stored token
        const token = getAuthToken();
        const userData = getUser();

        if (token && userData) {
          // If token and user exist, set user state
          setUser(userData);
          logger.log("User restored from storage", "info", userData);
          
          // After setting user from storage, attempt to get fresh user data
          try {
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser);
            logger.success("User data refreshed from API");
          } catch (err) {
            logger.warning("Failed to get current user, attempting token refresh", err);
            // If fetching current user fails, try to refresh the token
            const refreshed = await refreshToken();
            if (!refreshed) {
              clearAuthData();
              setUser(null);
            }
          }
        }
      } catch (err) {
        logger.error("Authentication initialization failed:", err);
        // Clear tokens if initialization fails
        clearAuthData();
      } finally {
        setIsLoading(false)
      }
    }

    initAuth();
  }, [refreshToken]);

  // Login function
  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(data);
      
      // Store token and user
      setAuthToken(response.token);
      
      // Use user from response or create from response fields
      const userData = response.user || {
        id: response.id,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        systemRole: response.systemRole || SystemRole.User
      };
      
      // Update in storage and local state
      setStoredUser(userData);
      setUser(userData);
      
      // Log authentication response for debugging with visually enhanced output
      authLogger.loginSuccess(userData, {
        received: !!response.token,
        refreshTokenReceived: !!response.refreshToken,
        expiration: response.refreshTokenExpiration
      });
      
      // Also log with standard logger
      logger.auth("Authentication Successful", {
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          systemRole: userData.systemRole !== undefined ? 
            `${SystemRole[userData.systemRole]} (${userData.systemRole})` : 'Not assigned'
        },
        authDetails: {
          tokenReceived: !!response.token,
          refreshTokenReceived: !!response.refreshToken,
          tokenExpiration: response.refreshTokenExpiration
        }
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        const errorMessage = (err.message as string) || "Login failed";
        setError(errorMessage);
        logger.error("Login failed:", errorMessage);
      } else {
        setError("Login failed");
        logger.error("Login failed: Unknown error");
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }, []);

  // Register function
  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(data);
      
      // In email verification flow, we don't automatically log in the user
      // So we don't set tokens or user data here
      
      logger.auth("Registration Successful", {
        email: data.email,
        message: "Verification email sent"
      });
      
      return response;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        const errorMessage = (err.message as string) || "Registration failed";
        setError(errorMessage);
        logger.error("Registration failed:", errorMessage);
      } else {
        setError("Registration failed");
        logger.error("Registration failed: Unknown error");
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await authApi.logout();
      authLogger.logout();
    } catch (err) {
      logger.error("Logout error:", err);
    } finally {
      // Clear user and tokens
      clearAuthData();
      setUser(null);
      router.push("/login");
      setIsLoading(false);
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={useMemo(() => ({
        user,
        isLoading,
        isAuthenticated: !!user,
        isSystemAdmin,
        login,
        register,
        logout,
        refreshToken,
        error,
      }), [user, isLoading, isSystemAdmin, login, register, logout, refreshToken, error])}
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
