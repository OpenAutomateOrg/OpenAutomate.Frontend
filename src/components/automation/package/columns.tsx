'use client'

import { ColumnDef } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'

import type { PackageRow } from './package'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
// import { DataTableRowActions } from '@/components/layout/table/data-table-row-actions'

export const columns: ColumnDef<PackageRow>[] = [
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
    accessorKey: 'version',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Version" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('version')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'toolVersion',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tool version" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('toolVersion')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'createdDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created date" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('createdDate')}</span>
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
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => (
      <div className="flex items-center whitespace-pre-wrap max-w-sm">
        <span>{row.getValue('description')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'releaseNote',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Release Note" />,
    cell: ({ row }) => (
      <div className="flex items-center whitespace-pre-wrap max-w-sm">
        <span>{row.getValue('releaseNote')}</span>
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
]
