'use client'

import { ColumnDef } from '@tanstack/react-table'
import React, { useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'

import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import {
  ScheduleResponseDto,
  RecurrenceType,
  getRecurrenceTypeDisplayName,
  formatNextRunTime,
} from '@/lib/api/schedules'
import DataTableRowAction from './data-table-row-actions'
import { formatUtcToLocal } from '@/lib/utils/datetime'

interface CreateScheduleColumnsProps {
  onDeleted?: () => void
  onToggleEnabled?: (schedule: ScheduleResponseDto) => Promise<void>
  onEdit?: (schedule: ScheduleResponseDto) => void
}

// Enhanced Switch component with loading state
const EnhancedSwitch = ({
  schedule,
  onToggleEnabled,
}: {
  schedule: ScheduleResponseDto
  onToggleEnabled?: (schedule: ScheduleResponseDto) => Promise<void>
}) => {
  const [isToggling, setIsToggling] = useState(false)

  const handleToggle = async () => {
    if (!onToggleEnabled || isToggling) return

    console.log(
      `Toggling schedule ${schedule.name} from ${schedule.isEnabled} to ${!schedule.isEnabled}`,
    )
    setIsToggling(true)

    try {
      await onToggleEnabled(schedule)
      console.log(`Successfully toggled schedule ${schedule.name}`)
    } catch (error) {
      console.error('Toggle failed:', error)
    } finally {
      setIsToggling(false)
    }
  }

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div className="flex items-center justify-center" onClick={stopPropagation}>
      <div className="relative">
        {isToggling && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full z-10">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          </div>
        )}
        <Switch
          checked={schedule.isEnabled}
          onCheckedChange={handleToggle}
          disabled={isToggling}
          aria-label={`${schedule.isEnabled ? 'Disable' : 'Enable'} schedule "${schedule.name}"`}
          className={`transition-all duration-200 ${isToggling ? 'opacity-50' : 'hover:scale-105'} cursor-pointer`}
        />
      </div>
    </div>
  )
}

export const createScheduleColumns = ({
  onDeleted,
  onToggleEnabled,
  onEdit,
}: CreateScheduleColumnsProps = {}): ColumnDef<ScheduleResponseDto>[] => [
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
    cell: ({ row }) => {
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Actions" />,
    cell: ({ row }) => (
      <DataTableRowAction
        schedule={row.original}
        onDeleted={onDeleted}
        onToggleEnabled={onToggleEnabled}
        onEdit={onEdit ? () => onEdit(row.original) : undefined}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Schedule Name" />,
    cell: ({ row }) => {
      const schedule = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium">{schedule.name}</span>
          {schedule.description && (
            <span className="text-sm text-muted-foreground">{schedule.description}</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'isEnabled',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const schedule = row.original
      return <EnhancedSwitch schedule={schedule} onToggleEnabled={onToggleEnabled} />
    },
  },
  {
    accessorKey: 'recurrenceType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Recurrence" />,
    cell: ({ row }) => {
      const recurrenceType = row.getValue('recurrenceType') as RecurrenceType
      return (
        <div className="flex items-center">
          <Badge variant="outline">{getRecurrenceTypeDisplayName(recurrenceType)}</Badge>
        </div>
      )
    },
  },
  {
    accessorKey: 'automationPackageName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Package" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('automationPackageName') || 'N/A'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'botAgentName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Agent" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span>{row.getValue('botAgentName') || 'N/A'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'nextRunTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Next Run" />,
    cell: ({ row }) => {
      const nextRunTime = row.getValue('nextRunTime') as string | undefined
      return (
        <div className="flex items-center">
          <span className="text-sm">{formatNextRunTime(nextRunTime)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'timeZoneId',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Timezone" />,
    cell: ({ row }) => (
      <div className="flex items-center">
        <span className="text-sm text-muted-foreground">{row.getValue('timeZoneId') || 'UTC'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string
      const formatted = formatUtcToLocal(createdAt, { fallback: '-' })
      return <span className="text-sm">{formatted}</span>
    },
  },
  {
    accessorKey: 'cronExpression',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cron Expression" />,
    cell: ({ row }) => {
      const cronExpression = row.getValue('cronExpression') as string | undefined
      const recurrenceType = row.original.recurrenceType

      if (recurrenceType === RecurrenceType.Advanced && cronExpression) {
        return (
          <div className="flex items-center">
            <code className="text-xs bg-muted px-2 py-1 rounded">{cronExpression}</code>
          </div>
        )
      }

      return <span className="text-sm text-muted-foreground">-</span>
    },
  },
]

// Default export for backward compatibility
export const columns = createScheduleColumns()
