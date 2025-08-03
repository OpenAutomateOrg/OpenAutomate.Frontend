'use client'

import { Table } from '@tanstack/react-table'
import { X, Search, Filter, Loader2 } from 'lucide-react'
import { useRef, useEffect, useMemo } from 'react'

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

interface DataTableToolbarProps<TData> {
  readonly table: Table<TData>
  readonly types: { value: string; label: string }[] // Options for Type filter
  readonly onSearch?: (value: string) => void
  readonly onTypeChange?: (value: string) => void
  readonly searchValue?: string
  readonly typeFilterValue?: string // Add explicit type filter value prop
  readonly isFiltering?: boolean
  readonly isPending?: boolean
}

export function DataTableToolbar<TData>({
  table,
  types,
  onSearch,
  onTypeChange,
  searchValue = '',
  typeFilterValue: propTypeFilterValue,
  isFiltering = false,
  isPending = false,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

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
      table.getColumn('key')?.setFilterValue(value)
    }
  }

  // Type filter value handling - use prop if provided, otherwise derive from table state
  const columnFilters = table.getState().columnFilters
  const typeFilterValue = useMemo(() => {
    if (propTypeFilterValue !== undefined) {
      return propTypeFilterValue
    }
    const typeFilter = columnFilters.find((filter) => filter.id === 'type')
    const value = typeFilter ? (typeFilter.value as string) : 'all'
    return value
  }, [propTypeFilterValue, columnFilters, table])

  return (
    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-full md:w-auto md:flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />

          <Input
            ref={searchInputRef}
            placeholder="Search by key..."
            value={searchValue}
            onChange={(event) => handleFilterChange(event.target.value)}
            className="h-10 pl-8 w-full pr-8"
            disabled={isFiltering}
            onFocus={() => {
              if (searchInputRef.current) {
                lastCursorPositionRef.current = searchInputRef.current.selectionStart
              }
            }}
          />

          {isFiltering && (
            <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-primary" />
          )}

          {!isFiltering && searchValue !== '' && (
            <X
              className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
              onClick={() => handleFilterChange('')}
            />
          )}
        </div>

        {/* Type Filter */}
        <div className="flex items-center space-x-1">
          <Select
            onValueChange={(value) => {
              if (onTypeChange) {
                onTypeChange(value)
              } else if (value === 'all') {
                table.getColumn('type')?.setFilterValue(undefined)
              } else {
                table.getColumn('type')?.setFilterValue(value)
              }
            }}
            value={typeFilterValue}
            disabled={isFiltering || isPending}
          >
            <SelectTrigger className="h-10 sm:w-[180px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter type" />
                {typeFilterValue !== 'all' && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1">
                    1
                  </Badge>
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
