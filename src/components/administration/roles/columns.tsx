'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'

import type { RolesRow } from './roles'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<RolesRow>[] = [
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
      <div className="flex items-center space-x-2">
        <span className="font-medium">{row.getValue('name')}</span>
        {row.original.isSystemAuthority && (
          <Badge variant="secondary" className="text-xs">
            System
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => (
      <div className="max-w-[300px]">
        <span className="text-sm text-muted-foreground">
          {row.getValue('description') || 'No description'}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'permissions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Permissions" />,
    cell: ({ row }) => {
      const permissions = row.original.permissions || []
      return (
        <div className="flex flex-wrap gap-1">
          {permissions.length > 0 ? (
            permissions.slice(0, 3).map((perm, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {perm.resourceName}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No permissions</span>
          )}
          {permissions.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{permissions.length - 3} more
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string
      try {
        return (
          <div className="text-sm text-muted-foreground">
            {format(new Date(date), 'MMM dd, yyyy')}
          </div>
        )
      } catch {
        return (
          <div className="text-sm text-muted-foreground">
            Invalid date
          </div>
        )
      }
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
