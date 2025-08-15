'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { swrKeys } from '@/lib/config/swr-config'
import { rolesApi, getPermissionDescription } from '@/lib/api/roles'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { CreateEditModal } from './create-edit-modal'
import { useLocale } from '@/providers/locale-provider'

interface RolesDetailProps {
  id: string
}

export default function RolesDetail({ id }: RolesDetailProps) {
  const { t } = useLocale()
  const router = useRouter()
  const { toast } = useToast()

  // ✅ SWR for data fetching - following guideline #2: use SWR for all API data
  const {
    data: role,
    error,
    isLoading,
    mutate,
  } = useSWR(swrKeys.roleById(id), () => rolesApi.getRoleById(id))

  // UI state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Handle SWR errors (following guideline #3: error handling in dedicated effects)
  // Client-only: Requires toast notifications for user feedback
  useEffect(() => {
    if (error) {
      console.error('Failed to load role:', error)
      toast({
        title: 'Error',
        description: 'Failed to load role details. Please try again.',
        variant: 'destructive',
      })
    }
  }, [error, toast])

  const handleBack = () => {
    router.back()
  }

  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  const handleDelete = async () => {
    if (!role) return

    try {
      await rolesApi.deleteRole(role.id)
      toast({
        title: 'Success',
        description: 'Role deleted successfully.',
      })
      router.back()
    } catch (error) {
      console.error('Failed to delete role:', error)

      // Extract error message with better handling for role deletion specific errors
      let errorMessage = 'Failed to delete role.'

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (error && typeof error === 'object') {
        // Handle API error responses
        const apiError = error as { message?: string; error?: string; details?: string }
        if (apiError.message) {
          errorMessage = apiError.message
        } else if (apiError.error) {
          errorMessage = apiError.error
        } else if (apiError.details) {
          errorMessage = apiError.details
        }
      }

      // Check if the error is related to users having this role assigned
      const lowerMessage = errorMessage.toLowerCase()
      if (
        lowerMessage.includes('user') ||
        lowerMessage.includes('assign') ||
        lowerMessage.includes('reference')
      ) {
        toast({
          title: 'Cannot Delete Role',
          description:
            'This role cannot be deleted because it is currently assigned to one or more users. Please remove the role from all users before attempting to delete it.',
          variant: 'destructive',
        })
      } else if (lowerMessage.includes('constraint') || lowerMessage.includes('foreign key')) {
        toast({
          title: 'Cannot Delete Role',
          description:
            'This role cannot be deleted because it is currently assigned to users. Please unassign this role from all users first.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Cannot Delete Role',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    }
  }

  const handleModalClose = async (shouldReload = false) => {
    setIsEditModalOpen(false)

    if (shouldReload) {
      await mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!role) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="border rounded-md shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Role not found.</p>
            <Button variant="outline" onClick={handleBack} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Roles
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="border rounded-md shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b p-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="gap-1" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <CardTitle className="text-xl">{role.name}</CardTitle>
              {role.isSystemAuthority && (
                <Badge variant="secondary" className="text-xs">
                  System Role
                </Badge>
              )}
            </div>
          </div>

          {!role.isSystemAuthority && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <DetailBlock label="Role Name">{role.name}</DetailBlock>
              <DetailBlock label="Description">
                {role.description || 'No description provided'}
              </DetailBlock>
            </div>
            <div className="space-y-4">
              <DetailBlock label="Type">
                <Badge variant={role.isSystemAuthority ? 'secondary' : 'outline'}>
                  {role.isSystemAuthority ? 'System Role' : 'Custom Role'}
                </Badge>
              </DetailBlock>
              <DetailBlock label="Created">{format(new Date(role.createdAt), 'PPP')}</DetailBlock>
              {role.updatedAt && (
                <DetailBlock label="Last Updated">
                  {format(new Date(role.updatedAt), 'PPP')}
                </DetailBlock>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Permissions</h3>
              {role.permissions && role.permissions.length > 0 ? (
                <div className="grid gap-3">
                  {role.permissions.map((permission) => (
                    <div
                      key={permission.resourceName}
                      className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{permission.resourceName}</span>
                        <Badge variant="outline">
                          {getPermissionDescription(permission.permission)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Level {permission.permission}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                  <p>No permissions assigned to this role.</p>
                  {!role.isSystemAuthority && (
                    <Button variant="outline" onClick={handleEdit} className="mt-2">
                      Add Permissions
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <CreateEditModal
        key={role.id} // ✅ Dynamic key to reset component state
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        editingRole={{
          id: role.id,
          name: role.name,
          description: role.description,
          isSystemAuthority: role.isSystemAuthority,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
          permissions: role.permissions,
        }}
      />
    </div>
  )
}

// Block hiển thị label trên, value dưới, có border-b
function DetailBlock({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="text-base font-medium pb-1 border-b">{children}</div>
    </div>
  )
}
