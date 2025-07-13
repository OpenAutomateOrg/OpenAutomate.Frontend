/**
 * Auth Logger - Specialized logging utility for authentication events
 * Provides nicely formatted console output specifically for authentication events
 */

import logger from './logger'
import { SystemRole, User } from '@/types/auth'

/**
 * Gets a user-friendly display name for a system role
 * @param role The system role - can be enum value or string from API
 * @returns A readable string representation of the role
 */
const getSystemRoleName = (role: SystemRole | string | undefined): string => {
  if (role === undefined) return 'Unknown'

  // Handle string values from API
  if (typeof role === 'string') {
    return role === 'Admin' ? 'Admin' : role === 'User' ? 'User' : role
  }

  // Handle enum values (numbers)
  if (typeof role === 'number') {
    return role === SystemRole.Admin ? 'Admin' : role === SystemRole.User ? 'User' : 'Unknown'
  }

  return 'Unknown'
}

/**
 * Logs a user login success event with formatted console output
 *
 * @param user The authenticated user information
 * @param token Token information (boolean indicators only for security)
 */
export const logLoginSuccess = (
  user: User,
  token: {
    received: boolean
    refreshTokenReceived: boolean
    expiration?: string
  },
) => {
  if (process.env.NODE_ENV === 'production') return

  // Prepare styled console output
  console.group(
    '%c🔐 LOGIN SUCCESSFUL',
    'color: #9b59b6; font-weight: bold; font-size: 14px; background: #f8f9fa; padding: 5px 10px; border-radius: 3px;',
  )

  // Display user info in a styled box
  console.log(
    '%cUser Information',
    'color: #2c3e50; font-weight: bold; font-size: 12px; border-bottom: 1px solid #ddd;',
  )

  console.table({
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    systemRole:
      user.systemRole !== undefined
        ? `${getSystemRoleName(user.systemRole)} (${user.systemRole})`
        : 'Not assigned',
  })

  // Display auth details
  console.log(
    '%cAuthentication Details',
    'color: #2c3e50; font-weight: bold; font-size: 12px; border-bottom: 1px solid #ddd;',
  )

  console.log(
    '%c✓ Access Token: ' + (token.received ? 'Received' : 'Not received'),
    `color: ${token.received ? '#27ae60' : '#e74c3c'}; font-weight: bold;`,
  )

  console.log(
    '%c✓ Refresh Token: ' + (token.refreshTokenReceived ? 'Received' : 'Not received'),
    `color: ${token.refreshTokenReceived ? '#27ae60' : '#e74c3c'}; font-weight: bold;`,
  )

  if (token.expiration) {
    const expirationDate = new Date(token.expiration)
    const now = new Date()
    const timeDiff = expirationDate.getTime() - now.getTime()
    const hoursDiff = Math.round(timeDiff / (1000 * 60 * 60))

    console.log(
      `%c✓ Token Expires: In approximately ${hoursDiff} hours (${expirationDate.toLocaleString()})`,
      'color: #f39c12; font-weight: bold;',
    )
  }

  // Add timestamp
  console.log('%cTimestamp: ' + new Date().toLocaleString(), 'color: #7f8c8d; font-style: italic;')

  console.groupEnd()
}

/**
 * Logs a user logout event
 */
export const logLogout = () => {
  logger.auth('User Logged Out', {
    timestamp: new Date().toLocaleString(),
    status: 'success',
  })
}

// Export as default object
const authLogger = {
  loginSuccess: logLoginSuccess,
  logout: logLogout,
}

export default authLogger
