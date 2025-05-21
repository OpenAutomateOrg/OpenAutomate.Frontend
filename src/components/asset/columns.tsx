'use client'

import { ColumnDef, Table, Column, Row } from '@tanstack/react-table'
import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import type { AssetRow } from './asset'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import DataTableRowAction from './data-table-row-actions'

type EditFunctionType = (asset: AssetRow) => void;

export const createColumns = (onEdit?: EditFunctionType, onDeleted?: () => void): ColumnDef<AssetRow>[] => [
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
    id: "actions",
    header: ({ column }: { column: Column<AssetRow, unknown> }) => (
      <DataTableColumnHeader column={column} title="Actions" />
    ),
    cell: ({ row }: { row: Row<AssetRow> }) => {
      return <DataTableRowAction asset={row.original} onEdit={onEdit} onDeleted={onDeleted} />
    },
  },
  {
    accessorKey: 'key',
    header: ({ column }: { column: Column<AssetRow, unknown> }) => <DataTableColumnHeader column={column} title="Key" className="font-bold text-base" />,
    cell: ({ row }: { row: Row<AssetRow> }) => {
      return (
        <span className="font-medium truncate">{row.getValue('key')}</span>
      )
    },
    filterFn: (row, id, value) => {
      const key = row.getValue(id);
      if (typeof key !== 'string' || typeof value !== 'string') return false;
      return key.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }: { column: Column<AssetRow, unknown> }) => <DataTableColumnHeader column={column} title="Type" className="font-bold text-base" />,
    cell: ({ row }: { row: Row<AssetRow> }) => {
      const typeValue = row.getValue('type');
      return (
        <span>
          {typeValue === 0 || typeValue === '0' ? 'String' : 'Secret'}
        </span>
      )
    },
    filterFn: (row, id, value) => {
      const rowValue = String(row.getValue(id))
      return rowValue === String(value)
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }: { column: Column<AssetRow, unknown> }) => <DataTableColumnHeader column={column} title="Description" className="font-bold text-base" />,
    cell: ({ row }: { row: Row<AssetRow> }) => {
      const desc = row.getValue('description');
      return (
        <span className={typeof desc === 'string' && desc.trim() ? '' : 'text-muted-foreground italic'}>
          {typeof desc === 'string' && desc.trim() ? desc : 'N/a'}
        </span>
      )
    },
  },
];

// Maintain backward compatibility
export const columns = createColumns();
