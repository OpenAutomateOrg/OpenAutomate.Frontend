'use client'

import React, { useState } from 'react'
import { Row } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { rolesApi } from '@/lib/api/roles'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RolesRow } from './roles'
import { CreateEditModal } from './create-edit-modal'
import { useToast } from '@/components/ui/use-toast'
import { canModifyRole } from '@/lib/constants/resources'

interface DataTableRowActionsProps {
  readonly row: Row<RolesRow>
  readonly onRefresh?: () => void
}

export default function DataTableRowAction({ row, onRefresh }: DataTableRowActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const { toast } = useToast()

  const canModify = canModifyRole(row.original)

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!canModifyRole(row.original)) {
      toast({
        title: 'Permission Denied',
        description: 'This role cannot be edited. It is either a system role or a default role.',
        variant: 'destructive',
      })
      return
    }
    setShowEdit(true)
  }

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!canModifyRole(row.original)) {
      toast({
        title: 'Permission Denied',
        description: 'This role cannot be deleted. It is either a system role or a default role.',
        variant: 'destructive',
      })
      return
    }
    setShowConfirm(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      await rolesApi.deleteRole(row.original.id)
      setShowConfirm(false)
      toast({
        title: 'Success',
        description: 'Role deleted successfully.',
      })
      if (onRefresh) onRefresh()
    } catch (err: unknown) {
      setShowConfirm(false)

      // Extract error message with better handling for role deletion specific errors
      let errorMessage = 'Failed to delete role.'

      if (err instanceof Error) {
        errorMessage = err.message
      } else if (err && typeof err === 'object') {
        // Handle API error responses
        const apiError = err as { message?: string; error?: string; details?: string; status?: number }
        if (apiError.status === 403) {
          errorMessage = 'You do not have permission to perform this action'
        } else if (apiError.message) {
          errorMessage = apiError.message
        } else if (apiError.error) {
          errorMessage = apiError.error
        } else if (apiError.details) {
          errorMessage = apiError.details
        }
      }

      // Check if the error is related to users having this role assigned
      const lowerMessage = errorMessage.toLowerCase()
      let description: string
      if (lowerMessage.includes('user') || lowerMessage.includes('assign') || lowerMessage.includes('reference')) {
        description = 'Cannot delete this role because it is currently assigned to one or more users. Please remove the role from all users before attempting to delete it.'
      } else if (lowerMessage.includes('constraint') || lowerMessage.includes('foreign key')) {
        description = 'Cannot delete this role because it is currently assigned to users. Please unassign this role from all users first.'
      } else {
        description = errorMessage
      }

      toast({
        title: 'Delete Failed',
        description,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[160px]"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            onClick={handleEdit}
            disabled={!canModify}
            className={!canModify ? 'cursor-not-allowed opacity-50' : ''}
          >
            <Pencil className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={`text-destructive focus:text-destructive ${!canModify ? 'cursor-not-allowed opacity-50' : ''}`}
            onClick={handleDelete}
            disabled={!canModify}
          >
            <Trash className="mr-2 h-4 w-4 text-destructive" aria-hidden="true" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Modal */}
      <CreateEditModal
        key={row.original.id} // Dynamic key to reset component state
        isOpen={showEdit}
        onClose={(shouldReload) => {
          setShowEdit(false)
          if (shouldReload && onRefresh) {
            onRefresh()
          }
        }}
        editingRole={row.original}
      />

      {/* Confirm Delete Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div>
            Are you sure you want to delete role <b>{row.original.name}</b>?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="text-white dark:text-neutral-900"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
