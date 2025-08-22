'use client'

import React, { useState } from 'react'
import { Row } from '@tanstack/react-table'
import { MoreHorizontal, Trash } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AutomationPackageResponseDto,
  deleteAutomationPackage,
} from '@/lib/api/automation-packages'
import { useToast } from '@/components/ui/use-toast'
import { createErrorToast } from '@/lib/utils/error-utils'

interface DataTableRowActionsProps {
  readonly row: Row<AutomationPackageResponseDto>
  readonly onRefresh?: () => void
}

export function DataTableRowActions({ row, onRefresh }: DataTableRowActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = () => {
    setShowConfirm(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteAutomationPackage(row.original.id)

      toast({
        title: 'Package deleted',
        description: `Package "${row.original.name}" has been deleted successfully.`,
        variant: 'default',
      })

      setShowConfirm(false)
      onRefresh?.()
    } catch (err: unknown) {
      setShowConfirm(false)
      toast(createErrorToast(err))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            aria-label={`Actions for package ${row.original.name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open actions menu for {row.original.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[160px]"
          onCloseAutoFocus={(e) => e.preventDefault()}
          sideOffset={5}
        >
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            disabled={isDeleting}
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirm Delete Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm} modal={true}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            if (isDeleting) e.preventDefault()
          }}
          aria-describedby="delete-description"
        >
          <DialogHeader>
            <DialogTitle>Confirm Delete Package</DialogTitle>
            <DialogDescription id="delete-description">
              Are you sure you want to delete package &ldquo;{row.original.name}&rdquo;? This will
              also delete all versions of this package. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              autoFocus
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="text-white dark:text-neutral-900"
              onClick={confirmDelete}
              disabled={isDeleting}
              aria-describedby="delete-description"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
