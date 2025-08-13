'use client'

import { MoreHorizontal, Trash, Pencil, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import React, { useState } from 'react'
import type { AssetRow } from './asset'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { useLocale } from '@/providers/locale-provider'

interface DataTableRowActionProps {
  readonly asset: AssetRow
  readonly onEdit?: (asset: AssetRow) => void
  readonly onDeleted?: () => void
}

export default function DataTableRowAction({ asset, onEdit, onDeleted }: DataTableRowActionProps) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { deleteAsset } = await import('@/lib/api/assets')
      await deleteAsset(asset.id)
      setOpen(false)
      if (onDeleted) onDeleted()
      toast({
        title: 'Success',
        description: 'Asset deleted successfully.',
      })
    } catch (err: unknown) {
      let message = 'Failed to delete asset.'
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as { message: unknown }).message === 'string'
      ) {
        const errorMessage = (err as { message: string }).message
        if (
          errorMessage.includes('403') ||
          errorMessage.includes('Forbidden') ||
          errorMessage.includes('forbidden') ||
          errorMessage.includes('permission')
        ) {
          message = 'You do not have permission to perform this action.'
        } else {
          message = errorMessage
        }
      }
      toast({
        title: 'Delete Failed',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
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
            aria-label={t('asset.actions.openMenu')}
            onClick={stopPropagation}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-[160px]"
          onClick={stopPropagation}
          onPointerDown={stopPropagation}
          onMouseDown={stopPropagation}
        >
          <DropdownMenuItem
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              if (onEdit) onEdit(asset)
            }}
          >
            <Pencil className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{t('asset.actions.edit')}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              setOpen(true)
            }}
          >
            <Trash className="mr-2 h-4 w-4 text-destructive" aria-hidden="true" />
            <span>{t('asset.actions.delete')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onInteractOutside={(e: Event) => e.preventDefault()}>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogHeader>
            <DialogTitle>{t('asset.dialogs.deleteConfirm.title')}</DialogTitle>
          </DialogHeader>
          <div>{t('asset.dialogs.deleteConfirm.message')}</div>
          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
              }}
              disabled={deleting}
            >
              {t('asset.dialogs.deleteConfirm.cancel')}
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
              {deleting ? t('common.deleting') : t('asset.dialogs.deleteConfirm.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
