'use client'

import React, { useState } from 'react'
import { Row } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { deleteBotAgent } from '@/lib/api/bot-agents'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AgentRow } from './agent'

interface DataTableRowActionsProps {
  readonly row: Row<AgentRow>
  readonly onRefresh?: () => void
  readonly onEdit?: (agent: AgentRow) => void
}

export default function DataTableRowAction({ row, onRefresh, onEdit }: DataTableRowActionsProps) {
  const { toast } = useToast()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // ✅ Simple edit handler using parent callback
  const handleEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (row.original.status !== 'Disconnected') {
      toast({
        title: 'Cannot Edit Agent',
        description: 'You can only edit an agent when its status is "Disconnected".',
        variant: 'destructive',
      })
      return
    }
    if (onEdit) {
      onEdit(row.original)
    }
  }

  const handleDelete = () => {
    setShowConfirm(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      if (row.original.status === 'Disconnected') {
        await deleteBotAgent(row.original.id)
        setShowConfirm(false)
        if (onRefresh) onRefresh()
      } else {
        setShowConfirm(false)
        toast({
          title: 'Cannot Delete Agent',
          description: 'You can only delete an agent when its status is "Disconnected".',
          variant: 'destructive',
        })
      }
    } catch (err: unknown) {
      setShowConfirm(false)

      let errorMessage = 'Failed to delete agent.'
      if (
        err &&
        typeof err === 'object' &&
        'status' in err &&
        (err as { status: number }).status === 403
      ) {
        errorMessage = 'You do not have permission to perform this action'
      } else if (err instanceof Error) {
        errorMessage = err.message
      }

      toast({
        title: 'Delete Failed',
        description: errorMessage,
        variant: 'destructive',
      })
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
            aria-label={`Actions for agent ${row.original.name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open actions menu for {row.original.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[160px]"
          onCloseAutoFocus={(e) => e.preventDefault()}
          sideOffset={5}
        >
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              handleEdit()
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirm Delete Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete agent <b>{row.original.name}</b>? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
