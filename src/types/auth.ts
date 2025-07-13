/**
 * Authentication related types
 */

/**
 * System-wide roles that determine global access levels
 */
export enum SystemRole {
  /**
   * Standard user with access limited to assigned tenant and permissions
   */
  User = 0,

  /**
   * System administrator with full access to system-wide functionality
   */
  Admin = 1,
}

/**
 * Permission levels for resources within an organization unit
 */
export enum PermissionLevel {
  /**
   * View access - read only
   */
  View = 1,

  /**
   * Create access - can create new resources
   */
  Create = 2,

  /**
   * Update access - can modify existing resources (includes Execute for automations)
   */
  Update = 3,

  /**
   * Delete access - full administrative access including deletion
   */
  Delete = 4,
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  systemRole: SystemRole | string
  isEmailVerified?: boolean
  lastLogin?: string
  createdAt?: string
}

/**
 * Resource permission for a specific resource within an organization unit
 */
export interface ResourcePermission {
  resourceName: string
  permission: PermissionLevel
}

/**
 * Organization unit with user's permissions within it
 */
export interface OrganizationUnitPermissions {
  id: string
  name: string
  slug: string
  permissions: ResourcePermission[]
}

/**
 * Complete user profile with permissions across all organization units
 */
export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  systemRole: SystemRole
  organizationUnits: OrganizationUnitPermissions[]
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
}

export interface AuthResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  systemRole: SystemRole
  token: string
  refreshToken: string
  refreshTokenExpiration: string
  user?: User
}

/**
 * Data transfer object for setting a user's system role
 */
export interface SetSystemRoleDto {
  role: SystemRole
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  email: string
  token: string
  newPassword: string
  confirmPassword: string
}

export interface ChangeUserNameRequest {
  firstName: string
  lastName: string
}
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface RevokeTokenRequest {
  token?: string
  reason?: string
}

/**
 * Error response from the API
 */
export interface ApiError {
  message: string
  status: number
  details?: string
}
