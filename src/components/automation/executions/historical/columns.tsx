'use client'

import { ColumnDef } from '@tanstack/react-table'
import React from 'react'

import { Checkbox } from '@/components/ui/checkbox'

import type { ExecutionsRow } from '../executions'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import ExecutionStatusBadge from '../execution-status-badge'
import DataTableRowAction from './data-table-row-actions'
import { formatUtcToLocal } from '@/lib/utils/datetime'

interface CreateHistoricalColumnsProps {
  onDeleted?: () => void
  t?: (key: string) => string
}

export const createColumns = ({
  onDeleted,
  t,
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t ? t('table.columns.actions') : 'Actions'} />
    ),
    cell: ({ row }) => <DataTableRowAction execution={row.original} onDeleted={onDeleted} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'packageName',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t ? t('table.columns.packageName') : 'Package Name'}
      />
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <span className="font-medium">{row.getValue('packageName') || 'N/A'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'Version',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t ? t('table.columns.packageVersion') : 'Package Version'}
      />
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('Version') || 'N/A'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'agent',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t ? t('table.columns.agent') : 'Agent'} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('agent')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'state',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t ? t('table.columns.state') : 'State'} />
    ),
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
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t ? t('table.columns.startTime') : 'Start Time'}
      />
    ),
    cell: ({ row }) => {
      const value = row.getValue('startTime') as string
      const formatted = formatUtcToLocal(value, {
        dateStyle: 'medium',
        timeStyle: 'short',
        fallback: 'N/A',
      })
      return (
        <div className="flex items-center">
          <span>{formatted}</span>
        </div>
      )
    },
    sortingFn: (rowA, rowB, columnId) => {
      const dateA = new Date(rowA.getValue(columnId) as string)
      const dateB = new Date(rowB.getValue(columnId) as string)

      // Handle invalid dates
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0
      if (isNaN(dateA.getTime())) return 1
      if (isNaN(dateB.getTime())) return -1

      // Sort by timestamp (newer first by default when desc=true)
      return dateA.getTime() - dateB.getTime()
    },
    enableSorting: true,
  },
  {
    accessorKey: 'endTime',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t ? t('table.columns.endTime') : 'End Time'} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('endTime') as string
      const formatted = formatUtcToLocal(value, {
        dateStyle: 'medium',
        timeStyle: 'short',
        fallback: 'N/A',
      })
      return (
        <div className="flex items-center">
          <span>{formatted}</span>
        </div>
      )
    },
    sortingFn: (rowA, rowB, columnId) => {
      const dateA = new Date(rowA.getValue(columnId) as string)
      const dateB = new Date(rowB.getValue(columnId) as string)

      // Handle invalid dates and null/undefined values
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0
      if (isNaN(dateA.getTime())) return 1 // Push invalid dates to bottom
      if (isNaN(dateB.getTime())) return -1

      // Sort by timestamp (newer first by default when desc=true)
      return dateA.getTime() - dateB.getTime()
    },
    enableSorting: true,
  },
  {
    accessorKey: 'source',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t ? t('table.columns.source') : 'Source'} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('source')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'command',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t ? t('table.columns.command') : 'Command'} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('command')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'schedules',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t ? t('table.columns.schedules') : 'Schedules'}
      />
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('schedules')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'taskId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t ? t('table.columns.taskId') : 'Task Id'} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('taskId')}</span>
      </div>
    ),
  },
]

// Default export for backward compatibility
export const columns = createColumns()
