'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { PermissionLevels, type AvailableResourceDto } from '@/lib/api/roles'

interface ResourcePermission {
  resourceName: string
  permission: number
  displayName: string
}

interface PermissionMatrixProps {
  availableResources: AvailableResourceDto[]
  currentPermissions: ResourcePermission[]
  onPermissionsChange: (permissions: ResourcePermission[]) => void
  isLoading?: boolean
}

const permissionOptions = [
  { value: PermissionLevels.NO_ACCESS, label: 'none', color: 'text-red-600' },
  { value: PermissionLevels.VIEW, label: 'view', color: 'text-blue-600' },
  { value: PermissionLevels.CREATE, label: 'create', color: 'text-green-600' },
  { value: PermissionLevels.UPDATE, label: 'edit', color: 'text-yellow-600' },
  { value: PermissionLevels.DELETE, label: 'delete', color: 'text-purple-600' },
]

export function PermissionMatrix({
  availableResources,
  currentPermissions,
  onPermissionsChange,
  isLoading = false,
}: PermissionMatrixProps) {
  // Internal state to track permissions for each resource
  const [permissions, setPermissions] = useState<Map<string, number>>(new Map())

  // Initialize permissions from currentPermissions
  useEffect(() => {
    const newPermissions = new Map<string, number>()
    
    // Set all resources to NO_ACCESS by default
    availableResources.forEach((resource) => {
      newPermissions.set(resource.resourceName, PermissionLevels.NO_ACCESS)
    })
    
    // Override with current permissions
    currentPermissions.forEach((perm) => {
      newPermissions.set(perm.resourceName, perm.permission)
    })
    
    setPermissions(newPermissions)
  }, [availableResources, currentPermissions])

  // Handle permission change for a resource
  const handlePermissionChange = (resourceName: string, permission: number) => {
    const newPermissions = new Map(permissions)
    newPermissions.set(resourceName, permission)
    setPermissions(newPermissions)

    // Convert to array and notify parent
    const permissionsArray: ResourcePermission[] = []
    availableResources.forEach((resource) => {
      const permissionLevel = newPermissions.get(resource.resourceName) ?? PermissionLevels.NO_ACCESS
      // Only include permissions that are not NO_ACCESS
      if (permissionLevel > PermissionLevels.NO_ACCESS) {
        permissionsArray.push({
          resourceName: resource.resourceName,
          permission: permissionLevel,
          displayName: resource.displayName,
        })
      }
    })
    
    onPermissionsChange(permissionsArray)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Label className="text-base font-medium">Resource Permissions</Label>
        <div className="text-sm text-muted-foreground p-8 text-center border rounded-lg border-dashed">
          Loading available resources...
        </div>
      </div>
    )
  }

  if (availableResources.length === 0) {
    return (
      <div className="space-y-4">
        <Label className="text-base font-medium">Resource Permissions</Label>
        <div className="text-sm text-muted-foreground p-8 text-center border rounded-lg border-dashed">
          No resources available for permission assignment.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Resource Permissions</Label>
      
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-muted/50 px-4 py-3 border-b">
          <div className="flex items-center">
            <div className="w-48 font-medium text-sm">Resource</div>
            <div className="flex-1 grid grid-cols-5 gap-4">
              {permissionOptions.map((option) => (
                <div key={option.value} className="text-center">
                  <span className={`text-sm font-medium ${option.color}`}>
                    {option.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resource Rows */}
        <div className="divide-y">
          {availableResources.map((resource) => {
            const currentPermission = permissions.get(resource.resourceName) ?? PermissionLevels.NO_ACCESS

            return (
              <div key={resource.resourceName} className="px-4 py-3 hover:bg-muted/25 transition-colors">
                <div className="flex items-center">
                  {/* Resource Name */}
                  <div className="w-48 font-medium text-sm pr-4">
                    {resource.displayName}
                  </div>

                  {/* Permission Radio Buttons */}
                  <div className="flex-1 grid grid-cols-5 gap-4">
                    {permissionOptions.map((option) => (
                      <div key={option.value} className="flex justify-center">
                        <input
                          type="radio"
                          id={`${resource.resourceName}-${option.value}`}
                          name={`permission-${resource.resourceName}`}
                          value={option.value}
                          checked={currentPermission === option.value}
                          onChange={() => handlePermissionChange(resource.resourceName, option.value)}
                          className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
                        />
                        <label
                          htmlFor={`${resource.resourceName}-${option.value}`}
                          className="sr-only"
                        >
                          {option.label} permission for {resource.displayName}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Help Text */}
      <div className="text-xs text-muted-foreground">
        <p>Select the permission level for each resource. Resources with &quot;none&quot; permission will not be included in the role.</p>
      </div>
    </div>
  )
}
