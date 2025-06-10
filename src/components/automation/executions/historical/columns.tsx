'use client'

import { ColumnDef } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'

import type { ExecutionsRow } from '../executions'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import ExecutionStatusBadge from '../ExecutionStatusBadge'
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
    accessorKey: 'agent',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Agent" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('agent')}</span>
      </div>
    ),
  },

  {
    accessorKey: 'state',
    header: ({ column }) => <DataTableColumnHeader column={column} title="State" />,
    cell: ({ row }) => {
      const state = String(row.getValue('state'))
      return (
        <div className="flex items-center">
          <ExecutionStatusBadge status={state} />
        </div>
      )
    },
  },
  {
    accessorKey: 'startTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Start Time" />,
    cell: ({ row }) => {
      const value = row.getValue('startTime')
      let formatted = ''
      try {
        if (value) {
          const date = new Date(value as string)
          if (!isNaN(date.getTime())) {
            formatted = new Intl.DateTimeFormat('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(date)
          }
        }
      } catch {}
      return <span>{formatted}</span>
    },
  },
  {
    accessorKey: 'endTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title="End Time" />,
    cell: ({ row }) => {
      const value = row.getValue('endTime')
      let formatted = ''
      try {
        if (value) {
          const date = new Date(value as string)
          if (!isNaN(date.getTime())) {
            formatted = new Intl.DateTimeFormat('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(date)
          }
        }
      } catch {}
      return <span>{formatted}</span>
    },
  },
  {
    accessorKey: 'source',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('source')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'command',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Command" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('command')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'schedules',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Schedules" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('schedules')}</span>
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
    accessorKey: 'createdDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created Date" />,
    cell: ({ row }) => {
      const value = row.getValue('createdDate')
      let formatted = ''
      try {
        if (value) {
          const date = new Date(value as string)
          if (!isNaN(date.getTime())) {
            formatted = new Intl.DateTimeFormat('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(date)
          }
        }
      } catch {}
      return <span>{formatted}</span>
    },
  },
  {
    accessorKey: 'createdBy',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created By" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('createdBy')}</span>
      </div>
    ),
  },
]
