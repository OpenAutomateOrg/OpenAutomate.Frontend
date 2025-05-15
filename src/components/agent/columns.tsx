'use client'

import { ColumnDef } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'

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
    accessorKey: 'version',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Version" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{row.getValue('version')}</span>
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
    accessorKey: 'agentGroup',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Agent Group" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{row.getValue('agentGroup')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'machineName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Machine name" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{row.getValue('machineName')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'machineUsername',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Machine Username" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{row.getValue('machineUsername')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span className="max-w-[500px] truncate">{row.getValue('description')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdBy',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created By" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{row.getValue('createdBy')}</span>
        </div>
      )
    },
  },
]
