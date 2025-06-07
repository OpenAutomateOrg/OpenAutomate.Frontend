import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { swrKeys, createSWRErrorMessage } from '@/lib/swr-config'
import { systemRolesApi } from '@/lib/api/system-roles'
import { User, SystemRole, SetSystemRoleDto } from '@/types/auth'
import { useAuth } from '@/providers/auth-provider'
import { useToast } from '@/components/ui/use-toast'

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
  refreshUsers: () => void
}

/**
 * Custom hook for working with system roles using SWR
 * @param options Configuration options
 * @returns Functions and state for system role management
 */
export function useSystemRoles(options: UseSystemRolesOptions = {}): UseSystemRolesResult {
  const { isSystemAdmin } = useAuth()
  const { toast } = useToast()

  // ✅ SWR for admin users - following guideline #8: use framework-level loaders
  const {
    data: adminUsers,
    error: adminError,
    isLoading: loadingAdmins,
    mutate: mutateAdmins
  } = useSWR(
    isSystemAdmin && options.fetchAdmins ? swrKeys.usersByRole(SystemRole.Admin.toString()) : null,
    () => systemRolesApi.getUsersByRole(SystemRole.Admin)
  )

  // ✅ SWR for standard users
  const {
    data: standardUsers,
    error: standardUserError,
    isLoading: loadingStandardUsers,
    mutate: mutateStandardUsers
  } = useSWR(
    isSystemAdmin && options.fetchStandardUsers ? swrKeys.usersByRole(SystemRole.User.toString()) : null,
    () => systemRolesApi.getUsersByRole(SystemRole.User)
  )

  // UI state for role changes
  const [changingRole, setChangingRole] = useState(false)
  const [changeRoleError, setChangeRoleError] = useState<string | null>(null)

  // ✅ Error handling in dedicated effects (guideline #3)
  // Client-only: Requires toast notifications for user feedback
  useEffect(() => {
    if (adminError) {
      console.error('Failed to load admin users:', adminError)
      toast({
        title: 'Error',
        description: createSWRErrorMessage(adminError),
        variant: 'destructive',
      })
    }
  }, [adminError, toast])

  useEffect(() => {
    if (standardUserError) {
      console.error('Failed to load standard users:', standardUserError)
      toast({
        title: 'Error',
        description: createSWRErrorMessage(standardUserError),
        variant: 'destructive',
      })
    }
  }, [standardUserError, toast])

  // Function to refresh both user lists
  const refreshUsers = useCallback(() => {
    if (options.fetchAdmins) {
      mutateAdmins()
    }
    if (options.fetchStandardUsers) {
      mutateStandardUsers()
    }
  }, [mutateAdmins, mutateStandardUsers, options.fetchAdmins, options.fetchStandardUsers])

  // Set a user's system role
  const setUserRole = useCallback(
    async (userId: string, role: SystemRole): Promise<boolean> => {
      if (!isSystemAdmin) return false

      setChangingRole(true)
      setChangeRoleError(null)

      try {
        const dto: SetSystemRoleDto = { role }
        await systemRolesApi.setUserRole(userId, dto)

        // ✅ Use SWR's mutate for cache invalidation
        refreshUsers()
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

  return {
    adminUsers: adminUsers ?? [],
    standardUsers: standardUsers ?? [],
    loadingAdmins,
    loadingStandardUsers,
    adminError: adminError ? createSWRErrorMessage(adminError) : null,
    standardUserError: standardUserError ? createSWRErrorMessage(standardUserError) : null,
    setUserRole,
    changingRole,
    changeRoleError,
    refreshUsers,
  }
}
