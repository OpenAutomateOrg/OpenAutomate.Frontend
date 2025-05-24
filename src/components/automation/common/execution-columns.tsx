'use client'

import { ColumnDef } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'

import type { ExcutionsRow } from '../excutions'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
// import { DataTableRowActions } from '@/components/layout/table/data-table-row-actions'

export const columns: ColumnDef<ExcutionsRow>[] = [
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
    accessorKey: 'workflow',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Workflow" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('workflow')}</span>
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
    accessorKey: 'agent',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Agent" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('agent')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'agentGroup',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Agent Group" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('agentGroup')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'state',
    header: ({ column }) => <DataTableColumnHeader column={column} title="State" />,
    cell: ({ row }) => {
      const state = String(row.getValue('state'))
      let stateClass = ''
      switch (state) {
        case 'Success':
          stateClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          break
        case 'Failed':
          stateClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          break
        case 'Running':
          stateClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
          break
        default:
          stateClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
      }
      return (
        <div className="flex items-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stateClass}`}>
            {state}
          </span>
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
