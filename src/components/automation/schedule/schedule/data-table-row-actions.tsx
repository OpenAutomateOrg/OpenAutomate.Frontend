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
import { useLocale } from '@/providers/locale-provider'

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
  const { t } = useLocale()

  const handleEdit = () => {
    if (onEdit) onEdit()
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteSchedule(schedule.id)

      toast({
        title: t('schedule.actions.deleted'),
        description: `${t('schedule.actions.schedule')} "${schedule.name}" ${t('schedule.actions.deletedSuccessfully')}.`,
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
        title: `${t('schedule.actions.schedule')} ${updatedSchedule.isEnabled ? t('schedule.actions.enabled') : t('schedule.actions.disabled')}`,
        description: `${t('schedule.actions.schedule')} "${schedule.name}" ${t('schedule.actions.hasBeenStatus')} ${updatedSchedule.isEnabled ? t('schedule.actions.enabledStatus') : t('schedule.actions.disabledStatus')}.`,
      })
    } catch (error) {
      console.error('Toggle enable failed:', error)
      toast(createErrorToast(error))
    } finally {
      setToggling(false)
    }
  }

  // Create a handler that stops propagation for all events
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={stopPropagation}>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            aria-label={t('common.openMenu')}
            onClick={stopPropagation}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-[180px]"
          onClick={stopPropagation}
          onPointerDown={stopPropagation}
          onMouseDown={stopPropagation}
        >
          <DropdownMenuItem
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              handleEdit()
            }}
          >
            <Edit className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{t('common.edit')}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              handleToggleEnabled()
            }}
            disabled={toggling}
          >
            {toggling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : schedule.isEnabled ? (
              <PowerOff className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Power className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
            <span>
              {toggling
                ? `${schedule.isEnabled ? t('schedule.actions.disabling') : t('schedule.actions.enabling')}...`
                : schedule.isEnabled
                  ? t('schedule.actions.disable')
                  : t('schedule.actions.enable')}
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
            <Trash className="mr-2 h-4 w-4 text-destructive" aria-hidden="true" />
            <span>{t('common.delete')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent onInteractOutside={(e: Event) => e.preventDefault()}>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">{t('common.close')}</span>
          </DialogClose>
          <DialogHeader>
            <DialogTitle>{t('schedule.actions.confirmDelete')}</DialogTitle>
          </DialogHeader>
          <div>
            {t('schedule.actions.confirmDeleteMessage')} <br />
            <span className="text-sm text-muted-foreground">
              {t('schedule.actions.schedule')}: <b>{schedule.name}</b>
            </span>
            <br />
            <span className="text-sm text-muted-foreground">
              {t('schedule.actions.cannotBeUndone')}
            </span>
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteDialogOpen(false)
              }}
              disabled={deleting}
            >
              {t('common.cancel')}
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
              {deleting ? t('schedule.actions.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
