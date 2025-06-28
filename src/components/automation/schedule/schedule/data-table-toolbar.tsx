'use client'

import { Table } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from '@/components/layout/table/data-table-view-options'
import { Loader2, Search, X } from 'lucide-react'
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
  recurrenceTypes: { value: string; label: string }[] // Options for Recurrence Type filter
  onSearch?: (value: string) => void
  onStatusChange?: (value: string) => void
  onRecurrenceTypeChange?: (value: string) => void
  searchValue?: string
  isFiltering?: boolean
  isPending?: boolean
  searchPlaceholder?: string
  totalCount?: number // Add totalCount prop for displaying total schedules
}

export function DataTableToolbar<TData>({
  table,
  statuses,
  recurrenceTypes,
  onSearch,
  onStatusChange,
  onRecurrenceTypeChange,
  searchValue = '',
  isFiltering = false,
  isPending = false,
  searchPlaceholder = 'Search schedules...',
  totalCount = 0,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (onSearch) {
      onSearch(value)
    }
  }

  const handleSearchClear = () => {
    if (onSearch) {
      onSearch('')
    }
  }

  const handleStatusFilterChange = (value: string) => {
    if (onStatusChange) {
      onStatusChange(value)
    }
  }

  const handleRecurrenceTypeFilterChange = (value: string) => {
    if (onRecurrenceTypeChange) {
      onRecurrenceTypeChange(value)
    }
  }

  const handleClearFilters = () => {
    table.resetColumnFilters()
    if (onSearch) {
      onSearch('')
    }
    if (onStatusChange) {
      onStatusChange('all')
    }
    if (onRecurrenceTypeChange) {
      onRecurrenceTypeChange('all')
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearchChange}
            className="h-8 w-[200px] pl-10 lg:w-[300px]"
            disabled={isFiltering}
          />
          {isPending && (
            <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {searchValue && !isPending && (
            <Button
              variant="ghost"
              onClick={handleSearchClear}
              className="absolute right-1 h-6 w-6 p-0 hover:bg-transparent"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Status:</p>
          <Select onValueChange={handleStatusFilterChange} defaultValue="all">
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Alternative Recurrence Type Filter using Select */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Type:</p>
          <Select onValueChange={handleRecurrenceTypeFilterChange} defaultValue="all">
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {recurrenceTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Clear Filters Button */}
        {isFiltered && (
          <Button variant="ghost" onClick={handleClearFilters} className="h-8 px-2 lg:px-3">
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Right side - View Options and Total Count */}
      <div className="flex items-center space-x-2">
        {totalCount > 0 && (
          <div className="text-sm text-muted-foreground">
            <span>
              {totalCount} schedule{totalCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
