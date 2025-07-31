'use client'

import { Table } from '@tanstack/react-table'
import { X, Search, Filter, Loader2 } from 'lucide-react'
import React, { useRef, useEffect } from 'react'

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
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils/utils'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  statuses: { value: string; label: string }[] // Options for Status filter
  onSearch?: (value: string) => void
  onStatusChange?: (value: string) => void
  searchValue?: string
  isFiltering?: boolean
  isPending?: boolean
  searchPlaceholder?: string // Add search placeholder prop
}

export function DataTableToolbar<TData>({
  table,
  statuses,
  onSearch,
  onStatusChange,
  searchValue = '',
  isFiltering = false,
  isPending = false,
  searchPlaceholder = 'Search by ID or Agent...',
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  const [date, setDate] = React.useState<Date | undefined>(undefined)
  // Get active filter count
  const activeFilterCount = table.getState().columnFilters.length

  // Create a ref for the search input to preserve focus
  const searchInputRef = useRef<HTMLInputElement>(null)
  const lastCursorPositionRef = useRef<number | null>(null)

  // Preserve the cursor position when the component re-renders
  useEffect(() => {
    // Only restore focus if we were previously focused
    if (
      document.activeElement !== searchInputRef.current &&
      lastCursorPositionRef.current !== null
    ) {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
        if (lastCursorPositionRef.current !== null) {
          searchInputRef.current.setSelectionRange(
            lastCursorPositionRef.current,
            lastCursorPositionRef.current,
          )
        }
      }
    }
  }, [isPending, isFiltering])

  const handleFilterChange = (value: string) => {
    // Save cursor position before potential re-render
    if (searchInputRef.current) {
      lastCursorPositionRef.current = searchInputRef.current.selectionStart
    }

    // If external search handler is provided, call it
    if (onSearch) {
      onSearch(value)
    } else {
      // Fallback to direct filter setting if no external handler
      table.getColumn('name')?.setFilterValue(value)
    }
  }
  interface HandleSelectProps {
    (selectedDate: Date | undefined): void
  }

  const handleSelect: HandleSelectProps = (selectedDate) => {
    setDate(selectedDate)

    // Format date as YYYY-MM-DD for the table filter
    const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
    table.getColumn('createdAt')?.setFilterValue(formattedDate)
  }

  return (
    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-full md:w-auto md:flex-1 max-w-md space-y-2">
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                  )}
                  disabled={isFiltering}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={handleSelect} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {/* Search Input */}
        <div className="relative">
          <Input
            ref={searchInputRef}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => handleFilterChange(event.target.value)}
            className="h-10 pl-8 pr-8 w-full"
            disabled={isFiltering}
            onFocus={() => {
              if (searchInputRef.current) {
                lastCursorPositionRef.current = searchInputRef.current.selectionStart
              }
            }}
          />

          {/* Search Icon */}
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />

          {/* Loading Spinner */}
          {isFiltering && (
            <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-primary" />
          )}

          {/* Clear Button */}
          {!isFiltering && searchValue !== '' && (
            <X
              className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
              onClick={() => handleFilterChange('')}
            />
          )}
        </div>

        {/* Agent Filter */}
        {table.getColumn('agent') && (
          <div className="flex items-center space-x-1">
            <Select
              onValueChange={(value) => {
                if (onStatusChange) {
                  onStatusChange(value)
                } else {
                  if (value === 'all') {
                    table.getColumn('agent')?.setFilterValue('')
                  } else {
                    table.getColumn('agent')?.setFilterValue(value)
                  }
                }
              }}
              value={(table.getColumn('agent')?.getFilterValue() as string) || 'all'}
              disabled={isFiltering || isPending}
            >
              <SelectTrigger className="h-10 sm:w-[180px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter agent" />
                  {(table.getColumn('agent')?.getFilterValue() as string | undefined) && (
                    <Badge variant="secondary" className="ml-2 rounded-sm px-1">
                      1
                    </Badge>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Package Filter */}
        {table.getColumn('packageName') && (
          <div className="flex items-center space-x-1">
            <Select
              onValueChange={(value) => {
                if (onStatusChange) {
                  onStatusChange(value)
                } else {
                  if (value === 'all') {
                    table.getColumn('packageName')?.setFilterValue('')
                  } else {
                    table.getColumn('packageName')?.setFilterValue(value)
                  }
                }
              }}
              value={(table.getColumn('packageName')?.getFilterValue() as string) || 'all'}
              disabled={isFiltering || isPending}
            >
              <SelectTrigger className="h-10 sm:w-[180px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter package" />
                  {(table.getColumn('packageName')?.getFilterValue() as string | undefined) && (
                    <Badge variant="secondary" className="ml-2 rounded-sm px-1">
                      1
                    </Badge>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Packages</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* State Filter */}
        {table.getColumn('state') && (
          <div className="flex items-center space-x-1">
            <Select
              onValueChange={(value) => {
                if (onStatusChange) {
                  onStatusChange(value)
                } else {
                  if (value === 'all') {
                    table.getColumn('state')?.setFilterValue('')
                  } else {
                    table.getColumn('state')?.setFilterValue(value)
                  }
                }
              }}
              value={(table.getColumn('state')?.getFilterValue() as string) || 'all'}
              disabled={isFiltering || isPending}
            >
              <SelectTrigger className="h-10 sm:w-[180px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter state" />
                  {(table.getColumn('state')?.getFilterValue() as string | undefined) && (
                    <Badge variant="secondary" className="ml-2 rounded-sm px-1">
                      1
                    </Badge>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Active Filter Count Badge */}
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="rounded-sm px-1">
            {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
          </Badge>
        )}

        {/* Reset Filters Button */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters()
              if (onSearch) onSearch('')
            }}
            className="h-8 px-2 lg:px-3"
            disabled={isFiltering}
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
