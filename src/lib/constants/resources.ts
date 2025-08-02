/**
 * Resource constants for authorization (matching backend Resources.cs)
 * These constants are used to check permissions for different features
 */
export const Resources = {
  /**
   * Bot Agent resource
   */
  AGENT: 'BotAgent',

  /**
   * Asset resource
   */
  ASSET: 'Asset',

  /**
   * Automation Package resource
   */
  PACKAGE: 'AutomationPackage',

  /**
   * Execution resource
   */
  EXECUTION: 'Execution',

  /**
   * Schedule resource
   */
  SCHEDULE: 'Schedule',

  /**
   * User resource
   */
  USER: 'User',

  /**
   * Organization Unit resource
   */
  ORGANIZATION_UNIT: 'OrganizationUnit',

  /**
   * Subscription resource
   */
  SUBSCRIPTION: 'Subscription',
} as const

/**
 * Default role names that cannot be edited or deleted
 */
export const PROTECTED_ROLES = [
  'OWNER',
  'DEVELOPER',
  'USER'
] as const

/**
 * Permission levels (matching backend Permissions.cs)
 */
export const Permissions = {
  NO_ACCESS: 0,
  VIEW: 1,
  CREATE: 2,
  UPDATE: 3,
  DELETE: 4,
} as const

/**
 * Helper to get resource display name
 */
export const getResourceDisplayName = (resource: string): string => {
  const displayNames: Record<string, string> = {
    [Resources.AGENT]: 'Bot Agents',
    [Resources.ASSET]: 'Assets',
    [Resources.PACKAGE]: 'Automation Packages',
    [Resources.EXECUTION]: 'Executions',
    [Resources.SCHEDULE]: 'Schedules',
    [Resources.USER]: 'Users',
    [Resources.ORGANIZATION_UNIT]: 'Organization Unit',
    [Resources.SUBSCRIPTION]: 'Subscription',
  }

  return displayNames[resource] || resource
}

/**
 * Helper to check if a role is a default role (cannot be edited or deleted)
 */
export const isProtectedRole = (roleName: string): boolean => {
  const normalizedRoleName = roleName.toUpperCase()
  return PROTECTED_ROLES.includes(normalizedRoleName as (typeof PROTECTED_ROLES)[number])
}

/**
 * Helper to check if a role can be edited or deleted
 */
export const canModifyRole = (role: { name: string; isSystemAuthority?: boolean }): boolean => {
  // Cannot modify if it's a system authority role or a default role
  return !role.isSystemAuthority && !isProtectedRole(role.name)
}

export type ResourceType = (typeof Resources)[keyof typeof Resources]
export type PermissionLevel = (typeof Permissions)[keyof typeof Permissions]
