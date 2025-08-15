'use client'

import { ColumnDef } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'

import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import { useLocale } from '@/providers/locale-provider'
// import { DataTableRowActions } from '@/components/layout/table/data-table-row-actions'

// Define a local type for organization unit rows (no 'any' allowed)
export type OrganizationUnitTableRow = {
  id: string
  name: string
  description?: string
}

export function useOrganizationUnitColumns(): ColumnDef<OrganizationUnitTableRow>[] {
  const { t } = useLocale()

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'actions',
      // cell: ({ row }) => <DataTableRowActions row={row} />,
      header: t('administration.organizationUnits.columns.action'),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('administration.organizationUnits.columns.name')}
        />
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <span>{row.getValue('name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('administration.organizationUnits.columns.description')}
        />
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <span>
            {row.getValue('description') || (
              <span className="italic text-muted-foreground">
                {t('administration.organizationUnits.search.noResults')}
              </span>
            )}
          </span>
        </div>
      ),
    },
  ]
}
