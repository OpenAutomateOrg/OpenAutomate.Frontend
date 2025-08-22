'use client'

import React, { useState } from 'react'
import { MoreHorizontal, Trash, Edit, Power, PowerOff, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  ScheduleResponseDto,
  deleteSchedule,
  enableSchedule,
  disableSchedule,
} from '@/lib/api/schedules'
import { createErrorToast } from '@/lib/utils/error-utils'

interface DataTableRowActionsProps {
  readonly schedule: ScheduleResponseDto
  readonly onDeleted?: () => void
  readonly onToggleEnabled?: (schedule: ScheduleResponseDto) => Promise<void>
  readonly onEdit?: () => void
}

export default function DataTableRowAction({
  schedule,
  onDeleted,
  onToggleEnabled,
  onEdit,
}: DataTableRowActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)
  const { toast } = useToast()

  const handleEdit = () => {
    if (onEdit) onEdit()
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteSchedule(schedule.id)

      toast({
        title: 'Schedule Deleted',
        description: `Schedule "${schedule.name}" has been deleted successfully.`,
      })

      setDeleteDialogOpen(false)
      if (onDeleted) onDeleted()
    } catch (error) {
      console.error('Delete failed:', error)
      toast(createErrorToast(error))
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleEnabled = async () => {
    if (onToggleEnabled) {
      await onToggleEnabled(schedule)
      return
    }

    // Fallback implementation if no parent handler provided
    setToggling(true)
    try {
      const updatedSchedule = schedule.isEnabled
        ? await disableSchedule(schedule.id)
        : await enableSchedule(schedule.id)

      toast({
        title: `Schedule ${updatedSchedule.isEnabled ? 'Enabled' : 'Disabled'}`,
        description: `Schedule "${schedule.name}" has been ${updatedSchedule.isEnabled ? 'enabled' : 'disabled'}.`,
      })
    } catch (error) {
      console.error('Toggle enable failed:', error)
      toast(createErrorToast(error))
    } finally {
      setToggling(false)
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            aria-label={`Actions for schedule ${schedule.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open actions menu for {schedule.name}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-[180px]"
          onCloseAutoFocus={(e) => e.preventDefault()}
          sideOffset={5}
        >
          <DropdownMenuItem
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              handleEdit()
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              handleToggleEnabled()
            }}
            disabled={toggling}
          >
            {(() => {
              if (toggling) {
                return <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              }
              if (schedule.isEnabled) {
                return <PowerOff className="mr-2 h-4 w-4" />
              }
              return <Power className="mr-2 h-4 w-4" />
            })()}
            <span>
              {toggling
                ? `${schedule.isEnabled ? 'Disabling' : 'Enabling'}...`
                : schedule.isEnabled
                  ? 'Disable'
                  : 'Enable'}
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              setDeleteDialogOpen(true)
            }}
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent onInteractOutside={(e: Event) => e.preventDefault()}>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule? <br />
              <span className="text-sm text-muted-foreground">
                Schedule: <b>{schedule.name}</b>
              </span>
              <br />
              <span className="text-sm text-muted-foreground">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteDialogOpen(false)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="text-white dark:text-neutral-900"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              disabled={deleting}
            >
              {deleting && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
