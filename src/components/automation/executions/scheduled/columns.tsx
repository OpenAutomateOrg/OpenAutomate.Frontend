'use client'

import { ColumnDef } from '@tanstack/react-table'
import { useLocale } from '@/providers/locale-provider'

import { Checkbox } from '@/components/ui/checkbox'

import type { ExecutionsRow } from '../executions'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
// import { DataTableRowActions } from '@/components/layout/table/data-table-row-actions'



export function useScheduledColumns({}): ColumnDef<ExecutionsRow>[] {
  const { t } = useLocale()

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
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
      accessorKey: 'packageName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('executions.columns.packageName')} />
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <span>{row.getValue('packageName')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'agent',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('executions.columns.agent')} />
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <span>{row.getValue('agent')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'nextRunTime',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('executions.columns.nextRunTime')} />
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <span>{row.getValue('nextRunTime')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'schedule',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('executions.columns.schedule')} />
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <span>{row.getValue('schedule')}</span>
        </div>
      ),
    },
  ]
}

// Export backward compatibility
export const createScheduledColumns = useScheduledColumns
