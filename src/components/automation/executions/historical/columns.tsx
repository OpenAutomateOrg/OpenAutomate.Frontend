'use client'

import { ColumnDef } from '@tanstack/react-table'
import React from 'react'

import { Checkbox } from '@/components/ui/checkbox'

import type { ExecutionsRow } from '../executions'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import ExecutionStatusBadge from '../execution-status-badge'
import DataTableRowAction from './data-table-row-actions'

interface CreateHistoricalColumnsProps {
  onDeleted?: () => void
}

export const createColumns = ({
  onDeleted,
}: CreateHistoricalColumnsProps = {}): ColumnDef<ExecutionsRow>[] => [
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
    cell: ({ row }) => {
      const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation()
      }

      return (
        <span
          onClick={stopPropagation}
          onMouseDown={stopPropagation}
          onPointerDown={stopPropagation}
        >
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean | 'indeterminate') => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
            onClick={stopPropagation}
          />
        </span>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Actions" />,
    cell: ({ row }) => <DataTableRowAction execution={row.original} onDeleted={onDeleted} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'packageName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Package Name" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span className="font-medium">{row.getValue('packageName') || 'N/A'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'Version',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Package Version" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('Version') || 'N/A'}</span>
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
      console.log('StartTime column value:', { value, type: typeof value, rowId: row.original.id })
      // The value is already formatted in the transformation function
      return <span>{typeof value === 'string' ? value : ''}</span>
    },
  },
  {
    accessorKey: 'endTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title="End Time" />,
    cell: ({ row }) => {
      const value = row.getValue('endTime')
      console.log('EndTime column value:', { value, type: typeof value, rowId: row.original.id })
      // The value is already formatted in the transformation function
      return <span>{typeof value === 'string' ? value : ''}</span>
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
]

// Default export for backward compatibility
export const columns = createColumns()
