'use client'

import { Row } from '@tanstack/react-table'
import { MoreHorizontal, Edit, Trash, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { X } from 'lucide-react'
import type { RolesRow } from './roles'

interface DataTableRowActionsProps {
  row: Row<RolesRow>
  onEdit?: (role: RolesRow) => void
  onDelete?: (roleId: string) => Promise<void>
}

export default function DataTableRowAction({ row, onEdit, onDelete }: DataTableRowActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const role = row.original

  const handleEdit = () => {
    if (onEdit) {
      onEdit(role)
    }
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(role.id)
      setDeleteDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete role. Please try again.',
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
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem
            onClick={handleEdit}
            disabled={role.isSystemAuthority}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDeleteClick}
            disabled={role.isSystemAuthority}
            className="flex items-center gap-2 text-destructive focus:text-destructive"
          >
            <Trash className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div>
            Are you sure you want to delete the role <b>{role.name}</b>?
            {role.isSystemAuthority && (
              <p className="text-sm text-muted-foreground mt-2">
                This is a system role and cannot be deleted.
              </p>
            )}
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="text-white dark:text-neutral-900"
              onClick={handleDeleteConfirm}
              disabled={isDeleting || role.isSystemAuthority}
            >
              {isDeleting && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
