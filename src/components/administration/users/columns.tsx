'use client'

import { ColumnDef } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'

import type { UsersRow } from './users'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
// import { DataTableRowActions } from '@/components/layout/table/data-table-row-actions'

export const columns: ColumnDef<UsersRow>[] = [
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
    accessorKey: 'login',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Login" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('login')}</span>
      </div>
    ),
  },

  // ── Email ────────────────────────────────────────────────
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => (
      <div className="flex items-center whitespace-pre-wrap max-w-md">
        <span>{row.getValue('email')}</span>
      </div>
    ),
  },

  // ── Language ─────────────────────────────────────────────
  {
    accessorKey: 'language',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Language" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('language')}</span>
      </div>
    ),
  },

  // ── Roles ────────────────────────────────────────────────
  {
    accessorKey: 'roles',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Roles" />,
    cell: ({ row }) => (
      <div className="flex items-center whitespace-pre-wrap max-w-md">
        <span>{row.getValue('roles')}</span>
      </div>
    ),
  },

  // ── Created date ─────────────────────────────────────────
  {
    accessorKey: 'createdDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created date" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('createdDate')}</span>
      </div>
    ),
  },

  // ── Modified by ───────────────────────────────────────────
  {
    accessorKey: 'modifiedBy',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Modified by" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('modifiedBy')}</span>
      </div>
    ),
  },

  // ── Modified date ────────────────────────────────────────
  {
    accessorKey: 'modifiedDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Modified date" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('modifiedDate')}</span>
      </div>
    ),
  },
]
