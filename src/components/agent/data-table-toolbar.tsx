'use client'

import { Table } from '@tanstack/react-table'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from '@/components/layout/table/data-table-view-options'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  statuses: { value: string; label: string }[] // Options for Status filter
}

export function DataTableToolbar<TData>({
  table,
  statuses,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Name Filter */}
        <Input
          placeholder="Filter names..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />

        {/* Status Filter */}
        {table.getColumn('status') && (
          <Select
            onValueChange={(value) => table.getColumn('status')?.setFilterValue(value)}
            value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Active Filter */}
        {table.getColumn('isActive') && (
          <Select
            onValueChange={(value) => {
              const boolValue = value === 'true' ? true : value === 'false' ? false : undefined;
              table.getColumn('isActive')?.setFilterValue(boolValue);
            }}
            value={
              table.getColumn('isActive')?.getFilterValue() === true
                ? 'true'
                : table.getColumn('isActive')?.getFilterValue() === false
                ? 'false'
                : ''
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by active state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Reset Filters Button */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
