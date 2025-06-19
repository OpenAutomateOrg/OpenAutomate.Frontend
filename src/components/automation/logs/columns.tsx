'use client'

import { ColumnDef } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'

import type { LogsRow } from './logs'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
// import { DataTableRowActions } from '@/components/layout/table/data-table-row-actions'

export const columns: ColumnDef<LogsRow>[] = [
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
    accessorKey: 'timeStamp',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Time Stamp" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('timeStamp')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'level',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Level" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('level')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'agentName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Agent Name" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('agentName')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'packageName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Package Name" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('packageName')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'version',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Version" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('version')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'taskId',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Task Id" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('taskId')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'message',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Message" />,
    cell: ({ row }) => (
      <div className="flex items-center whitespace-pre-wrap max-w-xl">
        <span>{row.getValue('message')}</span>
      </div>
    ),
  },
]
