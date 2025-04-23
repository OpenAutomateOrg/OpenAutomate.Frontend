"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authApi } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "@/types/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  error: string | null;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const TOKEN_KEY = "openAutomate-token";
const REFRESH_TOKEN_KEY = "openAutomate-refresh-token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      try {
        // Check for stored token
        const token = localStorage.getItem(TOKEN_KEY);

        if (token) {
          // If token exists, fetch current user
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Authentication initialization failed:", error);
        // Clear tokens if initialization fails
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(data);
      handleAuthResponse(response);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Login failed");
      } else {
        setError("Login failed");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(data);
      handleAuthResponse(response);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Registration failed");
      } else {
        setError("Registration failed");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);

    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear user and tokens
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      router.push("/login");
      setIsLoading(false);
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!currentRefreshToken) {
      setUser(null);
      return;
    }

    try {
      const response = await authApi.refreshToken({
        refreshToken: currentRefreshToken,
      });
      handleAuthResponse(response);
    } catch (error) {
      console.error("Failed to refresh token:", error);
      // Clear user and tokens on refresh failure
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      router.push("/login");
    }
  };

  // Handle auth response
  const handleAuthResponse = (response: AuthResponse) => {
    // Store tokens
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);

    // Set user
    setUser({
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshToken,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
