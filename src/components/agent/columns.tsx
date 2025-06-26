'use client'

import { ColumnDef, Column, Row } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'
import type { AgentRow } from './agent'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import DataTableRowAction from './data-table-row-actions'

export const createAgentColumns = (onRefresh?: () => void): ColumnDef<AgentRow>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Actions" />,
    cell: ({ row }) => <DataTableRowAction row={row} onRefresh={onRefresh} />,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <span className="max-w-[500px] truncate font-medium">{row.getValue('name')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'machineName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Machine Name" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('machineName')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = String(row.getValue('status'))

      // Define status badge styling based on the status value
      let statusClass = ''
      switch (status) {
        case 'Connected':
        case 'Available':
          statusClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          break
        case 'Busy':
          statusClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
          break
        case 'Disconnected':
        case 'Offline':
          statusClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
          break
        default:
          statusClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
      }

      return (
        <div className="flex items-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            {status}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'lastConnected',
    header: ({ column }: { column: Column<AgentRow> }) => (
      <DataTableColumnHeader column={column} title="Last Connected" />
    ),
    cell: ({ row }: { row: Row<AgentRow> }) => {
      // Get the value and convert it to a string to ensure it's safe for display
      const rawValue = row.getValue('lastConnected')
      let lastConnected = ''
      if (typeof rawValue === 'string') {
        lastConnected = rawValue
      } else if (rawValue !== null && rawValue !== undefined) {
        lastConnected = String(rawValue)
      }

      // Format the date if it's a valid date string
      let formattedDate = 'Never'
      try {
        if (lastConnected && lastConnected !== 'null' && lastConnected !== 'undefined') {
          const date = new Date(lastConnected)
          if (!isNaN(date.getTime())) {
            formattedDate = new Intl.DateTimeFormat('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(date)
          }
        }
      } catch (error) {
        console.error('Error formatting date:', error)
      }

      return (
        <div className="flex items-center">
          <span>{formattedDate}</span>
        </div>
      )
    },
  },
]
