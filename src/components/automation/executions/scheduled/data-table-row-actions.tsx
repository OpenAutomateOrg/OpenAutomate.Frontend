'use client'

import { Row } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { useLocale } from '@/providers/locale-provider'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ExecutionsRow } from '../executions'

interface DataTableRowActionsProps {
  row: Row<ExecutionsRow>
}

export default function DataTableRowAction({ row }: DataTableRowActionsProps) {
  const { t } = useLocale()

  const handleEdit = () => {
    console.log('Edit asset:', row.original)
  }

  const handleDelete = () => {
    console.log('Delete asset:', row.original)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('common.openMenu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={handleEdit}>{t('common.edit')}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete}>{t('common.delete')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
