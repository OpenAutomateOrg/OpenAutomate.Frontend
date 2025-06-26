'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDistanceToNow } from 'date-fns'

import type { OrganizationUnitRow } from './organizationUnit'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import DataTableRowAction from './data-table-row-actions'

export const columns: ColumnDef<OrganizationUnitRow>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <div className="font-medium">{row.getValue('name')}</div>
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate text-muted-foreground">
        {row.getValue('description') || '—'}
      </div>
    ),
  },
  {
    accessorKey: 'slug',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
    cell: ({ row }) => (
      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
        {row.getValue('slug')}
      </code>
    ),
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const isActive = row.getValue(id) as boolean
      if (value === 'active') return isActive
      if (value === 'inactive') return !isActive
      return true
    },
  },
  {
    accessorKey: 'userCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Users" />,
    cell: ({ row }) => <div className="text-center">{row.getValue('userCount') || 0}</div>,
  },
  {
    accessorKey: 'roleCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Roles" />,
    cell: ({ row }) => <div className="text-center">{row.getValue('roleCount') || 0}</div>,
  },
  {
    accessorKey: 'childrenCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sub-units" />,
    cell: ({ row }) => <div className="text-center">{row.getValue('childrenCount') || 0}</div>,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string
      return (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      const meta = table.options.meta as any
      return (
        <DataTableRowAction
          row={row}
          onEdit={meta?.onEdit}
          onDelete={meta?.onDelete}
          onViewUsers={meta?.onViewUsers}
        />
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
]
