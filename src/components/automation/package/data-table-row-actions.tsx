'use client'

import React, { useState } from 'react'
import { Row } from '@tanstack/react-table'
import { MoreHorizontal, Download, Pencil, Trash } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AutomationPackageResponseDto } from '@/lib/api/automation-packages'
import { useToast } from '@/components/ui/use-toast'
import { useLocale } from '@/providers/locale-provider'

interface DataTableRowActionsProps {
  row: Row<AutomationPackageResponseDto>
  onRefresh?: () => void
}

export function DataTableRowActions({ row, onRefresh }: DataTableRowActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const { t } = useLocale()

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    // Implement edit functionality
    toast({
      title: t('package.actions.editPackage'),
      description: `${t('package.actions.editingPackage')}: ${row.original.name}`,
    })
  }

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShowConfirm(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      // Implement delete functionality
      toast({
        title: t('package.actions.packageDeleted'),
        description: `${t('package.actions.packageName')} ${row.original.name} ${t('package.actions.hasBeenDeleted')}.`,
      })
      setShowConfirm(false)
      if (onRefresh) onRefresh()
    } catch (err: unknown) {
      setShowConfirm(false)
      let message = t('package.actions.deleteFailed')
      if (err && typeof err === 'object' && 'message' in err) {
        const errorMessage = (err as { message: unknown }).message
        if (
          typeof errorMessage === 'string' &&
          (errorMessage.includes('403') ||
            errorMessage.includes('Forbidden') ||
            errorMessage.includes('forbidden') ||
            errorMessage.includes('permission'))
        ) {
          message = t('package.actions.noPermission')
        } else if (typeof errorMessage === 'string') {
          message = errorMessage
        }
      }
      toast({
        title: t('package.actions.deleteFailedTitle'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    // Get the latest version for download
    const versions = row.original.versions
    if (versions && versions.length > 0) {
      const latestVersion = versions.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
      )[0]
      toast({
        title: t('package.actions.downloadingPackage'),
        description: `${t('package.actions.downloadingPackageDesc')}: ${row.original.name} ${t('package.actions.version')}: ${latestVersion.versionNumber}`,
      })
    } else {
      toast({
        title: t('package.actions.downloadFailed'),
        description: t('package.actions.noVersionsAvailable'),
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t('common.openMenu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{t('package.actions.download')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{t('common.edit')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleDelete}
          >
            <Trash className="mr-2 h-4 w-4 text-destructive" aria-hidden="true" />
            <span>{t('common.delete')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirm Delete Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t('package.actions.confirmDelete')}</DialogTitle>
          </DialogHeader>
          <div>
            {t('package.actions.confirmDeleteMessage')} <b>{row.original.name}</b>?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isDeleting}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              className="text-white dark:text-neutral-900"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
