'use client'

import { Table } from '@tanstack/react-table'
import { X, Search, Loader2 } from 'lucide-react'
import { useRef, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from '@/components/layout/table/data-table-view-options'
import { Badge } from '@/components/ui/badge'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onSearch?: (value: string) => void
  searchValue?: string
  isFiltering?: boolean
  isPending?: boolean
}

export function SearchDataTableToolbar<TData>({
  table,
  onSearch,
  searchValue = '',
  isFiltering = false,
  isPending = false,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  const activeFilterCount = table.getState().columnFilters.length

  const searchInputRef = useRef<HTMLInputElement>(null)
  const lastCursorPositionRef = useRef<number | null>(null)

  useEffect(() => {
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
    if (searchInputRef.current) {
      lastCursorPositionRef.current = searchInputRef.current.selectionStart
    }

    if (onSearch) {
      onSearch(value)
    } else {
      table.getColumn('name')?.setFilterValue(value)
    }
  }

  return (
    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-full md:w-auto md:flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />

          <Input
            ref={searchInputRef}
            placeholder="Search "
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

        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="rounded-sm px-1">
            {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
          </Badge>
        )}

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
