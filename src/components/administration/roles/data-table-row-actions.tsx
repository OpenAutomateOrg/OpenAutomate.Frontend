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
import { useLocale } from '@/providers/locale-provider'

interface DataTableRowActionsProps {
  readonly row: Row<RolesRow>
  readonly onRefresh?: () => void
}

export default function DataTableRowAction({ row, onRefresh }: DataTableRowActionsProps) {
  const { t } = useLocale()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const { toast } = useToast()

  const canModify = canModifyRole(row.original)

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!canModifyRole(row.original)) {
      toast({
        title: t('administration.roles.actions.permissionDenied'),
        description: t('administration.roles.actions.cannotEdit'),
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
        title: t('administration.roles.actions.permissionDenied'),
        description: t('administration.roles.actions.cannotDelete'),
        variant: 'destructive',
      })
      return
    }
    setShowConfirm(true)
  }

  const extractErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message
    }

    if (err && typeof err === 'object') {
      const apiError = err as {
        message?: string
        error?: string
        details?: string
        status?: number
      }
      if (apiError.status === 403) {
        return t('administration.roles.actions.noPermissionAction')
      }
      return (
        apiError.message ||
        apiError.error ||
        apiError.details ||
        t('administration.roles.actions.deleteFailed')
      )
    }

    return t('administration.roles.actions.deleteFailed')
  }

  const getErrorDescription = (errorMessage: string): string => {
    const lowerMessage = errorMessage.toLowerCase()

    if (
      lowerMessage.includes('user') ||
      lowerMessage.includes('assign') ||
      lowerMessage.includes('reference')
    ) {
      return t('administration.roles.actions.errorAssignedUsers')
    }

    if (lowerMessage.includes('constraint') || lowerMessage.includes('foreign key')) {
      return t('administration.roles.actions.errorConstraint')
    }

    return errorMessage
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      await rolesApi.deleteRole(row.original.id)
      setShowConfirm(false)
      toast({
        title: t('common.success'),
        description: t('administration.roles.actions.deleteSuccess'),
      })
      if (onRefresh) onRefresh()
    } catch (err: unknown) {
      setShowConfirm(false)
      const errorMessage = extractErrorMessage(err)
      const description = getErrorDescription(errorMessage)

      toast({
        title: t('administration.roles.actions.deleteFailedTitle'),
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
            <span>{t('common.edit')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={`text-destructive focus:text-destructive ${!canModify ? 'cursor-not-allowed opacity-50' : ''}`}
            onClick={handleDelete}
            disabled={!canModify}
          >
            <Trash className="mr-2 h-4 w-4 text-destructive" aria-hidden="true" />
            <span>{t('common.delete')}</span>
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
            <DialogTitle>{t('administration.roles.actions.confirmDelete')}</DialogTitle>
          </DialogHeader>
          <div>
            {t('administration.roles.actions.confirmDeleteMessage')} <b>{row.original.name}</b>?
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
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
