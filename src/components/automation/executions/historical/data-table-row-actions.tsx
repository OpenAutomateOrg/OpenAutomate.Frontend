'use client'

import { MoreHorizontal, Trash, Download, Loader2, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import React, { useState } from 'react'
import type { ExecutionsRow } from '../executions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { downloadExecutionLogs } from '@/lib/api/executions'
import { createErrorToast } from '@/lib/utils/error-utils'
import { useLocale } from '@/providers/locale-provider'

interface DataTableRowActionsProps {
  readonly execution: ExecutionsRow
  readonly onDeleted?: () => void
}

export default function DataTableRowAction({ execution, onDeleted }: DataTableRowActionsProps) {
  const { t } = useLocale()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setDeleting(true)
    try {
      // TODO: Implement deleteExecution API call when available
      // const { deleteExecution } = await import('@/lib/api/executions')
      // await deleteExecution(execution.id)

      // For now, just simulate the deletion
      console.log('Delete execution:', execution.id)
      toast({
        title: t('executions.actions.deleteSimulation'),
        description: t('executions.actions.deleteNotImplemented'),
      })

      setDeleteDialogOpen(false)
      if (onDeleted) onDeleted()
    } catch (error) {
      console.error('Delete failed:', error)
      let message = t('executions.actions.deleteFailed')
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: unknown }).message
        if (
          typeof errorMessage === 'string' &&
          (errorMessage.includes('403') ||
            errorMessage.includes('Forbidden') ||
            errorMessage.includes('forbidden') ||
            errorMessage.includes('permission'))
        ) {
          message = t('executions.actions.noPermission')
        } else if (typeof errorMessage === 'string') {
          message = errorMessage
        }
      }
      toast({
        title: t('executions.actions.deleteFailedTitle'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleDownloadLogs = async () => {
    if (!execution.hasLogs) {
      toast({
        title: 'No Logs Available',
        description: 'This execution does not have logs available for download.',
        variant: 'destructive',
      })
      return
    }

    setIsDownloading(true)
    try {
      const fileName = `execution_${execution.id.substring(0, 8)}_logs.log`
      await downloadExecutionLogs(execution.id, fileName)

      toast({
        title: 'Download Started',
        description: 'Execution logs download has started.',
      })
    } catch (error) {
      console.error('Failed to download logs:', error)
      toast(createErrorToast(error))
    } finally {
      setIsDownloading(false)
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
            aria-label="Open menu"
            onClick={stopPropagation}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[180px]"
          onClick={stopPropagation}
          onPointerDown={stopPropagation}
          onMouseDown={stopPropagation}
        >
          <DropdownMenuItem
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              handleDownloadLogs()
            }}
            disabled={!execution.hasLogs || isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : execution.hasLogs ? (
              <Download className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
            <span>
              {isDownloading
                ? t('executions.actions.downloading')
                : execution.hasLogs
                  ? t('executions.actions.viewLogs')
                  : t('executions.actions.noLogs')}
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
            <DialogTitle>{t('executions.actions.confirmDelete')}</DialogTitle>
          </DialogHeader>
          <div>
            {t('executions.actions.confirmDeleteMessage')} <br />
            <span className="text-sm text-muted-foreground">
              {t('executions.actions.executionId')}: <b>{execution.id.substring(0, 8)}...</b>
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
              {deleting ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
