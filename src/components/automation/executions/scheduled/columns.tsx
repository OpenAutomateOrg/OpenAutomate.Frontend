'use client'

import { ColumnDef } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'

import type { ExecutionsRow } from '../executions'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
// import { DataTableRowActions } from '@/components/layout/table/data-table-row-actions'

export const columns: ColumnDef<ExecutionsRow>[] = [
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
    accessorKey: 'packageName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Package name" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('packageName')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'packageVersion',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Package Version" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('packageVersion')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'agent',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Agent" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('agent')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'nextRunTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Next Run Time" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('nextRunTime')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'schedule',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Schedule" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('schedule')}</span>
      </div>
    ),
  },
]
