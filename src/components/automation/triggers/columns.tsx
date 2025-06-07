'use client'

import { ColumnDef } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'

import type { TriggersRow } from './triggers'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
// import { DataTableRowActions } from '@/components/layout/table/data-table-row-actions'

export const columns: ColumnDef<TriggersRow>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean | 'indeterminate') => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'actions',
    // cell: ({ row }) => <DataTableRowActions row={row} />,
    header: 'Action',
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('name')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'component',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Component" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('component')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'conditions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Conditions" />,
    cell: ({ row }) => (
      <div className="flex items-center whitespace-pre-wrap max-w-md">
        <span>{row.getValue('conditions')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'activities',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Activities" />,
    cell: ({ row }) => (
      <div className="flex items-center whitespace-pre-wrap max-w-md">
        <span>{row.getValue('activities')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('status')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'createdDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created date" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('createdDate')}</span>
      </div>
    ),
  },
]
