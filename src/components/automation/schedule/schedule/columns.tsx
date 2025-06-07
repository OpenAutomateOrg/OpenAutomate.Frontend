'use client'

import { ColumnDef } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'

import type { ScheduleRow } from '../page'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
// import { DataTableRowActions } from '@/components/layout/table/data-table-row-actions'

export const columns: ColumnDef<ScheduleRow>[] = [
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
    accessorKey: 'agentGroup',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Agent Group" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('agentGroup')}</span>
      </div>
    ),
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
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('status')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'startTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Start Time" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('startTime')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'endTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title="End Time" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('endTime')}</span>
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
    accessorKey: 'lastRunTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Run Time" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('lastRunTime')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'triggerDetails',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Trigger Details" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('triggerDetails')}</span>
      </div>
    ),
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
  {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('date')}</span>
      </div>
    ),
  },
]
