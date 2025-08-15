'use client'

import { ColumnDef, Table, Column, Row } from '@tanstack/react-table'
import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import type { AssetRow } from './asset'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import DataTableRowAction from './data-table-row-actions'
import { useLocale } from '@/providers/locale-provider'

type EditFunctionType = (asset: AssetRow) => void

interface UseColumnsProps {
  onEdit?: EditFunctionType
  onDeleted?: () => void
}

export function useColumns({ onEdit, onDeleted }: UseColumnsProps = {}): ColumnDef<AssetRow>[] {
  const { t } = useLocale()

  return [
    {
      id: 'select',
      header: ({ table }: { table: Table<AssetRow> }) => (
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
      cell: ({ row }: { row: Row<AssetRow> }) => {
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
      header: ({ column }: { column: Column<AssetRow, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('asset.columns.actions')} />
      ),
      cell: ({ row }: { row: Row<AssetRow> }) => {
        return <DataTableRowAction asset={row.original} onEdit={onEdit} onDeleted={onDeleted} />
      },
    },
    {
      accessorKey: 'key',
      header: ({ column }: { column: Column<AssetRow, unknown> }) => (
        <DataTableColumnHeader
          column={column}
          title={t('asset.columns.key')}
          className="font-bold text-base"
        />
      ),
      cell: ({ row }: { row: Row<AssetRow> }) => {
        return <span className="font-medium truncate">{row.getValue('key')}</span>
      },
      filterFn: (row, id, value) => {
        const key = row.getValue(id)
        if (typeof key !== 'string' || typeof value !== 'string') return false
        return key.toLowerCase().includes(value.toLowerCase())
      },
    },
    {
      accessorKey: 'type',
      header: ({ column }: { column: Column<AssetRow, unknown> }) => (
        <DataTableColumnHeader
          column={column}
          title={t('asset.columns.type')}
          className="font-bold text-base"
        />
      ),
      cell: ({ row }: { row: Row<AssetRow> }) => {
        const typeValue = row.getValue('type')
        // Handle both number and string types from API
        if (typeValue === 0 || typeValue === '0' || typeValue === 'String') {
          return <span>{t('asset.types.string')}</span>
        }
        return <span>{t('asset.types.secret')}</span>
      },
      filterFn: (row, id, value) => {
        const rowValue = row.getValue(id)
        const stringValue = String(value)

        // Convert the row value to the same format as filter value for comparison
        if (rowValue === 0 || rowValue === '0' || rowValue === 'String') {
          return stringValue === '0' || stringValue === 'String'
        } else {
          return stringValue === '1' || stringValue === 'Secret'
        }
      },
    },
    {
      accessorKey: 'description',
      header: ({ column }: { column: Column<AssetRow, unknown> }) => (
        <DataTableColumnHeader
          column={column}
          title={t('asset.columns.description')}
          className="font-bold text-base"
        />
      ),
      cell: ({ row }: { row: Row<AssetRow> }) => {
        const desc = row.getValue('description')
        return (
          <span
            className={
              typeof desc === 'string' && desc.trim() ? '' : 'text-muted-foreground italic'
            }
          >
            {typeof desc === 'string' && desc.trim() ? desc : 'N/a'}
          </span>
        )
      },
    },
  ]
}

// For backward compatibility - create a simple hook version
export const createColumns = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEdit?: EditFunctionType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDeleted?: () => void,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  t?: (key: string) => string,
): ColumnDef<AssetRow>[] => {
  // This is a temporary wrapper for backward compatibility
  // Components should migrate to useColumns hook
  console.warn('createColumns is deprecated. Use useColumns hook instead.')
  return [] // Return empty array as placeholder - components should use useColumns
}
