'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

import type { AgentRow } from './agent'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
// import { DataTableRowActions } from '@/components/layout/table/data-table-row-actions'

export const columns: ColumnDef<AgentRow>[] = [
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
    // cell: ({ row }) => <DataTableRowActions row={row} />,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">{row.getValue('name')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'machineName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Machine Name" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{row.getValue('machineName')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'machineKey',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Machine Key" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{row.getValue('machineKey')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{row.getValue('status')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'lastConnected',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Connected" />,
    cell: ({ row }) => {
      const timestamp = row.getValue('lastConnected') as string;
      // Format the date if it exists, otherwise show "Never"
      const formattedDate = timestamp ? format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss') : 'Never';
      return (
        <div className="flex items-center">
          <span>{formattedDate}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Active" />,
    cell: ({ row }) => {
      const isActive = Boolean(row.getValue('isActive'));
      return (
        <div className="flex items-center">
          <Badge variant={isActive ? "default" : "destructive"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      )
    },
  }
]
