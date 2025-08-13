'use client'

import { ColumnDef } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'

import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
// import { DataTableRowActions } from '@/components/layout/table/data-table-row-actions'

// Define a local type for organization unit rows (no 'any' allowed)
export type OrganizationUnitTableRow = {
  id: string
  name: string
  description?: string
}

interface CreateOrganizationUnitColumnsProps {
  t?: (key: string) => string
}

export const createOrganizationUnitColumns = ({
  t,
}: CreateOrganizationUnitColumnsProps = {}): ColumnDef<OrganizationUnitTableRow>[] => [
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
    header: t ? t('administration.organizationUnits.columns.action') : 'Action',
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t ? t('administration.organizationUnits.columns.name') : 'Name'}
      />
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('name')}</span>
      </div>
    ),
  },
]

// Export backward compatibility
export const columns = createOrganizationUnitColumns()
