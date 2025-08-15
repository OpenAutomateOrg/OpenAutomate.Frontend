'use client'

import { Row } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { OrganizationUnitTableRow } from './columns'
import { useLocale } from '@/providers/locale-provider'

interface DataTableRowActionsProps {
  row: Row<OrganizationUnitTableRow>
}

export default function DataTableRowAction({ row }: DataTableRowActionsProps) {
  const { t } = useLocale()

  const handleEdit = () => {
    console.log('Edit organization unit:', row.original)
  }

  const handleDelete = () => {
    console.log('Delete organization unit:', row.original)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('asset.actions.openMenu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={handleEdit}>
          {t('administration.organizationUnits.actions.edit')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete}>
          {t('administration.organizationUnits.actions.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
