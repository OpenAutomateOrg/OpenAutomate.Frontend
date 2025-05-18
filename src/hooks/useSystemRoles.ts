import { useState, useEffect, useCallback } from 'react'
import { systemRolesApi } from '@/lib/api/system-roles'
import { User, SystemRole, SetSystemRoleDto } from '@/types/auth'
import { useAuth } from '@/providers/auth-provider'

interface UseSystemRolesOptions {
  /**
   * Whether to fetch users with the Admin role on mount
   */
  fetchAdmins?: boolean

  /**
   * Whether to fetch users with the User role on mount
   */
  fetchStandardUsers?: boolean
}

interface UseSystemRolesResult {
  /**
   * List of admin users
   */
  adminUsers: User[]

  /**
   * List of standard users
   */
  standardUsers: User[]

  /**
   * Whether admin users are being loaded
   */
  loadingAdmins: boolean

  /**
   * Whether standard users are being loaded
   */
  loadingStandardUsers: boolean

  /**
   * Error message if fetching admin users fails
   */
  adminError: string | null

  /**
   * Error message if fetching standard users fails
   */
  standardUserError: string | null

  /**
   * Function to set a user's system role
   */
  setUserRole: (userId: string, role: SystemRole) => Promise<boolean>

  /**
   * Whether a role change operation is in progress
   */
  changingRole: boolean

  /**
   * Error message if changing a role fails
   */
  changeRoleError: string | null

  /**
   * Function to refresh the lists of users
   */
  refreshUsers: () => Promise<void>
}

/**
 * Custom hook for working with system roles
 * @param options Configuration options
 * @returns Functions and state for system role management
 */
export function useSystemRoles(options: UseSystemRolesOptions = {}): UseSystemRolesResult {
  const { isSystemAdmin } = useAuth()
  const [adminUsers, setAdminUsers] = useState<User[]>([])
  const [standardUsers, setStandardUsers] = useState<User[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [loadingStandardUsers, setLoadingStandardUsers] = useState(false)
  const [adminError, setAdminError] = useState<string | null>(null)
  const [standardUserError, setStandardUserError] = useState<string | null>(null)
  const [changingRole, setChangingRole] = useState(false)
  const [changeRoleError, setChangeRoleError] = useState<string | null>(null)

  // Fetch admin users
  const fetchAdminUsers = useCallback(async () => {
    if (!isSystemAdmin) return

    setLoadingAdmins(true)
    setAdminError(null)

    try {
      const users = await systemRolesApi.getUsersByRole(SystemRole.Admin)
      setAdminUsers(users)
    } catch (error) {
      console.error('Error fetching admin users:', error)
      setAdminError('Failed to load admin users')
    } finally {
      setLoadingAdmins(false)
    }
  }, [isSystemAdmin])

  // Fetch standard users
  const fetchStandardUsers = useCallback(async () => {
    if (!isSystemAdmin) return

    setLoadingStandardUsers(true)
    setStandardUserError(null)

    try {
      const users = await systemRolesApi.getUsersByRole(SystemRole.User)
      setStandardUsers(users)
    } catch (error) {
      console.error('Error fetching standard users:', error)
      setStandardUserError('Failed to load standard users')
    } finally {
      setLoadingStandardUsers(false)
    }
  }, [isSystemAdmin])

  // Function to refresh both user lists
  const refreshUsers = useCallback(async () => {
    if (options.fetchAdmins) {
      await fetchAdminUsers()
    }

    if (options.fetchStandardUsers) {
      await fetchStandardUsers()
    }
  }, [fetchAdminUsers, fetchStandardUsers, options.fetchAdmins, options.fetchStandardUsers])

  // Set a user's system role
  const setUserRole = useCallback(
    async (userId: string, role: SystemRole): Promise<boolean> => {
      if (!isSystemAdmin) return false

      setChangingRole(true)
      setChangeRoleError(null)

      try {
        const dto: SetSystemRoleDto = { role }
        await systemRolesApi.setUserRole(userId, dto)

        // Refresh the user lists after a successful role change
        await refreshUsers()
        return true
      } catch (error) {
        console.error('Error setting user role:', error)
        setChangeRoleError('Failed to change user role')
        return false
      } finally {
        setChangingRole(false)
      }
    },
    [isSystemAdmin, refreshUsers],
  )

  // Load initial data
  useEffect(() => {
    if (isSystemAdmin) {
      if (options.fetchAdmins) {
        fetchAdminUsers()
      }

      if (options.fetchStandardUsers) {
        fetchStandardUsers()
      }
    }
  }, [
    isSystemAdmin,
    fetchAdminUsers,
    fetchStandardUsers,
    options.fetchAdmins,
    options.fetchStandardUsers,
  ])

  return {
    adminUsers,
    standardUsers,
    loadingAdmins,
    loadingStandardUsers,
    adminError,
    standardUserError,
    setUserRole,
    changingRole,
    changeRoleError,
    refreshUsers,
  }
}
