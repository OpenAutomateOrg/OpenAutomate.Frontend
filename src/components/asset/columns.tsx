'use client'

import { ColumnDef, Table, Column, Row } from '@tanstack/react-table'
import React from 'react'

import { Checkbox } from '@/components/ui/checkbox'

import type { AssetRow } from './asset'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
// import { DataTableRowActions } from '@/components/layout/table/data-table-row-actions'

export const columns: ColumnDef<AssetRow>[] = [
  {
    id: 'select',
    header: ({ table }: { table: Table<AssetRow> }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }: { row: Row<AssetRow> }) => (
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
    accessorKey: 'key',
    header: ({ column }: { column: Column<AssetRow, unknown> }) => <DataTableColumnHeader column={column} title="Key" />,
    cell: ({ row }: { row: Row<AssetRow> }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">{row.getValue('key')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }: { column: Column<AssetRow, unknown> }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }: { row: Row<AssetRow> }) => {
      const typeValue = row.getValue('type');
      return (
        <div className="flex w-[100px] items-center">
          <span>{typeValue === 0 || typeValue === '0' ? 'String' : 'Secret'}</span>
        </div>
      )
    },
    filterFn: (row: Row<AssetRow>, id: string, value: string[]) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }: { column: Column<AssetRow, unknown> }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }: { row: Row<AssetRow> }) => {
      const desc = row.getValue('description');
      return (
        <div className="flex items-center">
          <span>{typeof desc === 'string' && desc.trim() ? desc : 'N/a'}</span>
        </div>
      )
    },
    filterFn: (row: Row<AssetRow>, id: string, value: string[]) => {
      return value.includes(row.getValue(id))
    },
  },
]
