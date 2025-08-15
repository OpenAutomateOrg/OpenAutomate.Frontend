'use client'

import { ColumnDef } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import type { UsersRow } from './users'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import DataTableRowAction from './data-table-row-actions'
import { useLocale } from '@/providers/locale-provider'

export function useUsersColumns(): ColumnDef<UsersRow>[] {
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
      id: 'actions',
      header: t('administration.users.columns.action'),
      cell: ({ row }) => <DataTableRowAction row={row} />,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('administration.users.columns.email')} />
      ),
      cell: ({ row }) => <span>{row.getValue('email')}</span>,
    },
    {
      accessorKey: 'firstName',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('administration.users.columns.firstName')}
        />
      ),
      cell: ({ row }) => <span>{row.getValue('firstName')}</span>,
    },
    {
      accessorKey: 'lastName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('administration.users.columns.lastName')} />
      ),
      cell: ({ row }) => <span>{row.getValue('lastName')}</span>,
    },
    {
      accessorKey: 'roles',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('administration.users.columns.roles')} />
      ),
      cell: ({ row }) => {
        const value = row.getValue('roles')
        let roles: string[] = []
        if (Array.isArray(value)) {
          roles = value
        } else if (typeof value === 'string') {
          roles = value
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean)
        }
        const maxShow = 3
        return (
          <TooltipProvider>
            <div className="flex flex-wrap gap-1 max-w-[320px]">
              {roles.slice(0, maxShow).map((role) => (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded text-xs truncate max-w-[90px] bg-muted text-muted-foreground dark:bg-secondary dark:text-secondary-foreground"
                  title={role}
                >
                  {role}
                </span>
              ))}
              {roles.length > maxShow && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-gray-500 cursor-pointer">
                      +{roles.length - maxShow} {t('administration.users.tooltips.moreRoles')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{roles.slice(maxShow).join(', ')}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: 'joinedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('administration.users.columns.joinedAt')} />
      ),
      cell: ({ row }) => <span>{row.getValue('joinedAt')}</span>,
    },
  ]
}
