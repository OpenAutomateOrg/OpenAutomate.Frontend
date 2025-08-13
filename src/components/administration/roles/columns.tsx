'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

import type { RolesRow } from './roles'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import DataTableRowAction from './data-table-row-actions'
import { formatUtcToLocal } from '@/lib/utils/datetime'
import { isProtectedRole, canModifyRole } from '@/lib/constants/resources'

interface CreateRolesColumnsProps {
  onRefresh?: () => void
  t?: (key: string) => string
}

export const createRolesColumns = ({
  onRefresh,
  t,
}: CreateRolesColumnsProps = {}): ColumnDef<RolesRow>[] => [
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
        disabled={!canModifyRole(row.original)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'actions',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t ? t('administration.roles.columns.actions') : 'Actions'}
      />
    ),
    cell: ({ row }) => <DataTableRowAction row={row} onRefresh={onRefresh} />,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t ? t('administration.roles.columns.name') : 'Name'}
      />
    ),
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <span className="font-medium">{row.getValue('name')}</span>
        {row.original.isSystemAuthority && (
          <Badge variant="secondary" className="text-xs">
            {t ? t('administration.roles.badges.system') : 'System'}
          </Badge>
        )}
        {isProtectedRole(row.original.name) && (
          <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
            {t ? t('administration.roles.badges.default') : 'Default'}
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t ? t('administration.roles.columns.description') : 'Description'}
      />
    ),
    cell: ({ row }) => (
      <div className="max-w-[300px]">
        <span className="text-sm text-muted-foreground">
          {row.getValue('description') ||
            (t ? t('administration.roles.placeholders.noDescription') : 'No description')}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'permissions',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t ? t('administration.roles.columns.permissions') : 'Permissions'}
      />
    ),
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
            <span className="text-xs text-muted-foreground">
              {t ? t('administration.roles.placeholders.noPermissions') : 'No permissions'}
            </span>
          )}
          {permissions.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{permissions.length - 3}{' '}
              {t ? t('administration.roles.tooltips.morePermissions') : 'more'}
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t ? t('administration.roles.columns.created') : 'Created'}
      />
    ),
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string
      const formatted = formatUtcToLocal(date, {
        dateStyle: 'medium',
        timeStyle: undefined, // Only show date, no time
        fallback: 'Invalid date',
      })
      return <div className="text-sm text-muted-foreground">{formatted}</div>
    },
  },
]
