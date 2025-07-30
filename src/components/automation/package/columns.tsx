'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AutomationPackageResponseDto,
  PackageVersionResponseDto,
} from '@/lib/api/automation-packages'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { formatUtcToLocal } from '@/lib/utils/datetime'

export const createPackageColumns = (
  onRefresh?: () => void,
): ColumnDef<AutomationPackageResponseDto>[] => [
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
    cell: ({ row }) => <DataTableRowActions row={row} onRefresh={onRefresh} />,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Actions" />,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <span className="max-w-[500px] truncate font-medium">{row.getValue('name')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span className="max-w-md truncate" title={row.getValue('description') as string}>
          {row.getValue('description')}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'versions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Latest Version" />,
    cell: ({ row }) => {
      const versions = row.getValue('versions') as PackageVersionResponseDto[]
      const latestVersion =
        versions && versions.length > 0
          ? [...versions].sort(
              (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
            )[0]
          : null

      return (
        <div className="flex items-center">
          <Badge variant="secondary">
            {latestVersion ? latestVersion.versionNumber : 'No versions'}
          </Badge>
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'versions',
    id: 'versionCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Version Count" />,
    cell: ({ row }) => {
      const versions = row.getValue('versions') as PackageVersionResponseDto[]
      const count = versions ? versions.length : 0

      return (
        <div className="flex items-center">
          <span>{count}</span>
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean

      return (
        <div className="flex items-center">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created Date" />,
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string
      const formattedDate = formatUtcToLocal(createdAt, { 
        dateStyle: 'medium',
        timeStyle: undefined, // Only show date, no time
        fallback: 'Invalid date' 
      })

      return (
        <div className="flex items-center">
          <span>{formattedDate}</span>
        </div>
      )
    },
  },
]

// Export a default columns array for backward compatibility
export const columns = createPackageColumns()
