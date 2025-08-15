'use client'

import { Row } from '@tanstack/react-table'
import { MoreHorizontal, Trash, Loader2, X, UserCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { deleteOrganizationUnitUser } from '@/lib/api/organization-unit-user'
import React, { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useLocale } from '@/providers/locale-provider'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UsersRow } from './users'
import SetRoleModal from './set-role-modal'

interface DataTableRowActionsProps {
  readonly row: Row<UsersRow>
  readonly onDeleted?: () => void
}

export default function DataTableRowAction({ row, onDeleted }: DataTableRowActionsProps) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [setRoleOpen, setSetRoleOpen] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteOrganizationUnitUser(row.original.userId)
      setOpen(false)
      if (onDeleted) onDeleted()
    } catch (err: unknown) {
      let message = t('administration.users.actions.deleteFailed')
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as Record<string, unknown>).message === 'string'
      ) {
        const errorMessage = (err as Record<string, unknown>).message as string
        if (
          errorMessage.includes('403') ||
          errorMessage.includes('Forbidden') ||
          errorMessage.includes('forbidden') ||
          errorMessage.includes('permission')
        ) {
          message = t('administration.users.actions.noPermission')
        } else {
          message = errorMessage
        }
      }
      toast({
        title: t('administration.users.actions.deleteFailedTitle'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
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
        <DropdownMenuContent align="start" className="w-[160px]">
          <DropdownMenuItem
            onClick={() => setSetRoleOpen(true)}
            className="flex items-center gap-2"
          >
            <span className="min-w-[1.25rem] flex justify-center">
              <UserCheck className="w-4 h-4 text-foreground" />
            </span>
            <span>{t('administration.users.actions.setRole')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 text-destructive focus:text-destructive"
            onClick={() => setOpen(true)}
          >
            <span className="min-w-[1.25rem] flex justify-center">
              <Trash className="w-4 h-4 text-destructive" aria-hidden="true" />
            </span>
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SetRoleModal
        isOpen={setRoleOpen}
        onClose={() => setSetRoleOpen(false)}
        userId={row.original.userId}
        email={row.original.email}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">{t('common.close')}</span>
          </DialogClose>
          <DialogHeader>
            <DialogTitle>{t('administration.users.actions.confirmDeleteTitle')}</DialogTitle>
          </DialogHeader>
          <div>
            {t('administration.users.actions.confirmDelete')} <b>{row.original.email}</b>?
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              className="text-white dark:text-neutral-900"
              onClick={handleDelete}
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
