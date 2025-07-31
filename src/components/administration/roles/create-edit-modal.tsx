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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import {
  rolesApi,
  PermissionLevels,
  getPermissionDescription,
  isValidPermissionLevel,
  type CreateRoleDto,
  type UpdateRoleDto,
} from '@/lib/api/roles'
import useSWR from 'swr'
import { swrKeys } from '@/lib/config/swr-config'
import type { RolesRow } from './roles'

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

  // Resource selection state
  const [selectedResource, setSelectedResource] = useState('')
  const [selectedPermission, setSelectedPermission] = useState('')
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
  const [resourcePermissions, setResourcePermissions] = useState<ResourcePermission[]>(() => {
    // ✅ Lazy initial state to avoid dependency on memoized value
    if (!editingRole?.permissions || !availableResources) return []

    return editingRole.permissions.map((p) => {
      const resource = availableResources.find((r) => r.resourceName === p.resourceName)
      return {
        resourceName: p.resourceName,
        permission: p.permission,
        displayName: resource?.displayName ?? p.resourceName,
      }
    })
  })

  const handleAddResourcePermission = () => {
    if (!selectedResource || !selectedPermission) {
      toast({
        title: 'Validation Error',
        description: 'Please select both a resource and permission level.',
        variant: 'destructive',
      })
      return
    }

    const permission = parseInt(selectedPermission)
    if (!isValidPermissionLevel(permission)) {
      toast({
        title: 'Validation Error',
        description: 'Invalid permission level selected.',
        variant: 'destructive',
      })
      return
    }

    // Check if resource already has permission
    const existingIndex = resourcePermissions.findIndex((p) => p.resourceName === selectedResource)
    const resource = availableResources?.find((r) => r.resourceName === selectedResource)

    const newPermission: ResourcePermission = {
      resourceName: selectedResource,
      permission,
      displayName: resource?.displayName ?? selectedResource,
    }

    if (existingIndex >= 0) {
      // Update existing permission
      const updated = [...resourcePermissions]
      updated[existingIndex] = newPermission
      setResourcePermissions(updated)
    } else {
      // Add new permission
      setResourcePermissions([...resourcePermissions, newPermission])
    }

    // Reset selection
    setSelectedResource('')
    setSelectedPermission('')
  }

  const handleRemoveResourcePermission = (resourceName: string) => {
    setResourcePermissions((prev) => prev.filter((p) => p.resourceName !== resourceName))
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
      if (errorWithMessage.message.includes('permission')) {
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

  const availableResourcesForSelection =
    availableResources?.filter(
      (resource) => !resourcePermissions.some((p) => p.resourceName === resource.resourceName),
    ) ?? []

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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
            <div className="grid gap-4">
              <Label>Resource Permissions</Label>

              {/* Add Resource Permission */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Select value={selectedResource} onValueChange={setSelectedResource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingResources ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        availableResourcesForSelection.map((resource) => (
                          <SelectItem key={resource.resourceName} value={resource.resourceName}>
                            {resource.displayName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                    <SelectTrigger>
                      <SelectValue placeholder="Permission level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PermissionLevels.NO_ACCESS.toString()}>
                        {getPermissionDescription(PermissionLevels.NO_ACCESS)}
                      </SelectItem>
                      <SelectItem value={PermissionLevels.VIEW.toString()}>
                        {getPermissionDescription(PermissionLevels.VIEW)}
                      </SelectItem>{' '}
                      <SelectItem value={PermissionLevels.CREATE.toString()}>
                        {getPermissionDescription(PermissionLevels.CREATE)}
                      </SelectItem>
                      <SelectItem value={PermissionLevels.UPDATE.toString()}>
                        {getPermissionDescription(PermissionLevels.UPDATE)}
                      </SelectItem>
                      <SelectItem value={PermissionLevels.DELETE.toString()}>
                        {getPermissionDescription(PermissionLevels.DELETE)}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  onClick={handleAddResourcePermission}
                  disabled={!selectedResource || !selectedPermission}
                  variant="outline"
                >
                  Add Permission
                </Button>
              </div>

              {/* Current Resource Permissions */}
              <div className="space-y-2">
                {resourcePermissions.length > 0 ? (
                  <div className="grid gap-2">
                    <div className="text-sm font-medium">Current Permissions:</div>
                    {resourcePermissions.map((perm) => (
                      <div
                        key={perm.resourceName}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">{perm.displayName}</span>
                          <Badge variant="outline">
                            {getPermissionDescription(perm.permission)}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveResourcePermission(perm.resourceName)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg border-dashed">
                    No permissions assigned. Add permissions above to define what this role can
                    access.
                  </div>
                )}
              </div>
            </div>
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
