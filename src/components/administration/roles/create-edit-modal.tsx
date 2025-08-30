'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { useToast } from '@/components/ui/use-toast'
import {
  rolesApi,
  type CreateRoleDto,
  type UpdateRoleDto,
} from '@/lib/api/roles'
import useSWR from 'swr'
import { swrKeys } from '@/lib/config/swr-config'
import type { RolesRow } from './roles'
import { PermissionMatrix } from './permission-matrix'

interface CreateEditModalProps {
  isOpen: boolean
  onClose: (shouldReload?: boolean) => void
  editingRole?: RolesRow | null
}

interface ResourcePermission {
  resourceName: string
  permission: number
  displayName: string
}

export function CreateEditModal({ isOpen, onClose, editingRole }: CreateEditModalProps) {
  const { toast } = useToast()

  // Form state
  const [isLoading, setIsLoading] = useState(false)

  // ✅ SWR for available resources - following guideline #8: use framework-level loaders
  const {
    data: availableResources,
    error: resourcesError,
    isLoading: loadingResources,
  } = useSWR(
    isOpen ? swrKeys.availableResources() : null, // Only fetch when modal is open
    rolesApi.getAvailableResources,
  )

  // ✅ Handle SWR errors (following guideline #3: error handling in dedicated effects)
  // Client-only: Requires toast notifications for user feedback
  useEffect(() => {
    if (resourcesError) {
      console.error('Failed to load resources:', resourcesError)
      toast({
        title: 'Error',
        description: 'Failed to load available resources.',
        variant: 'destructive',
      })
    }
  }, [resourcesError, toast])

  // ✅ Initialize form state directly from props (following guideline #4: use dynamic key to reset state)
  // Note: Parent component uses dynamic key: key={editingRole?.id ?? 'new'}
  // This ensures component remounts and state resets when switching between create/edit modes
  const [roleName, setRoleName] = useState(editingRole?.name ?? '')
  const [roleDescription, setRoleDescription] = useState(editingRole?.description ?? '')
  const [resourcePermissions, setResourcePermissions] = useState<ResourcePermission[]>([])

  // ✅ Update resourcePermissions when both editingRole and availableResources are available
  useEffect(() => {
    if (editingRole?.permissions && availableResources) {
      console.log('Loading permissions for edit role:', editingRole.name, editingRole.permissions)
      const permissions = editingRole.permissions.map((p) => {
        const resource = availableResources.find((r) => r.resourceName === p.resourceName)
        return {
          resourceName: p.resourceName,
          permission: p.permission,
          displayName: resource?.displayName ?? p.resourceName,
        }
      })
      setResourcePermissions(permissions)
      console.log('Mapped permissions:', permissions)
    } else if (!editingRole) {
      // Reset for create mode
      setResourcePermissions([])
    }
  }, [editingRole, availableResources])

  // Handle permission changes from the matrix
  const handlePermissionsChange = (newPermissions: ResourcePermission[]) => {
    setResourcePermissions(newPermissions)
  }


  // Helper function to validate form data
  const validateForm = (): string | null => {
    if (!roleName.trim()) {
      return 'Role name is required.'
    }
    if (roleName.length < 2 || roleName.length > 50) {
      return 'Role name must be between 2 and 50 characters.'
    }
    if (roleDescription.length > 200) {
      return 'Description cannot exceed 200 characters.'
    }
    // Only require permissions for new roles, allow existing roles to have zero permissions
    if (!editingRole && resourcePermissions.length === 0) {
      return 'At least one resource permission must be added.'
    }
    return null
  }

  // Helper function to get error message from API error
  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'message' in error) {
      const errorWithMessage = error as { message: string }
      if (errorWithMessage.message.includes('already exists')) {
        return `A role with the name "${roleName}" already exists. Please choose a different name.`
      }
      if (errorWithMessage.message.includes('validation')) {
        return 'Please check your input and try again.'
      }
      if (
        errorWithMessage.message.includes('permission') ||
        errorWithMessage.message.includes('403') ||
        errorWithMessage.message.includes('Forbidden') ||
        errorWithMessage.message.includes('forbidden')
      ) {
        return 'You do not have permission to perform this action.'
      }
      return errorWithMessage.message
    }
    return 'Failed to save role. Please try again.'
  }

  // Helper function to save role (create or update)
  const saveRole = async (): Promise<void> => {
    const roleData = {
      name: roleName.trim(),
      description: roleDescription.trim(),
      resourcePermissions: resourcePermissions.map((p) => ({
        resourceName: p.resourceName,
        permission: p.permission,
      })),
    }

    if (editingRole) {
      console.log('Updating role with data:', roleData)
      await rolesApi.updateRole(editingRole.id, roleData as UpdateRoleDto)
      toast({
        title: 'Success',
        description: 'Role updated successfully.',
      })
    } else {
      console.log('Creating role with data:', roleData)
      await rolesApi.createRole(roleData as CreateRoleDto)
      toast({
        title: 'Success',
        description: 'Role created successfully.',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      await saveRole()
      onClose(true) // Reload data
    } catch (error: unknown) {
      console.error('Failed to save role:', error)

      toast({
        title: editingRole ? 'Update Failed' : 'Creation Failed',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Do not render the dialog at all when closed to guarantee overlay unmount
  if (!isOpen) return null

  return (
    <Dialog modal={false} open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Role Name */}
            <div className="grid gap-2">
              <Label htmlFor="roleName">Name *</Label>
              <Input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Enter role name"
                maxLength={50}
                required
              />
              <div className="text-xs text-muted-foreground">{roleName.length}/50 characters</div>
            </div>

            {/* Role Description */}
            <div className="grid gap-2">
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Enter role description (optional)"
                maxLength={200}
                rows={3}
              />
              <div className="text-xs text-muted-foreground">
                {roleDescription.length}/200 characters
              </div>
            </div>

            {/* Resource Permissions */}
            <PermissionMatrix
              availableResources={availableResources ?? []}
              currentPermissions={resourcePermissions}
              onPermissionsChange={handlePermissionsChange}
              isLoading={loadingResources}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || loadingResources}>
              {isLoading ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
