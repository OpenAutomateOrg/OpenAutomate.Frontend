'use client'

import { Table } from '@tanstack/react-table'
import { X, Search, Filter, Loader2 } from 'lucide-react'
import { useRef, useEffect } from 'react'

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
  readonly roles: { value: string; label: string }[] // Options for Role filter
  readonly onSearch?: (value: string) => void
  readonly onRoleChange?: (value: string) => void
  readonly searchValue?: string
  readonly isFiltering?: boolean
  readonly isPending?: boolean
}

export function DataTableToolbar<TData>({
  table,
  roles,
  onSearch,
  onRoleChange,
  searchValue = '',
  isFiltering = false,
  isPending = false,
}: DataTableToolbarProps<TData>) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  const isFiltered = table.getState().columnFilters.length > 0

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    onSearch?.(value)
  }

  const handleRoleFilterChange = (value: string) => {
    if (value === 'all') {
      onRoleChange?.('')
    } else {
      onRoleChange?.(value)
    }
  }

  const clearFilters = () => {
    table.resetColumnFilters()
    onSearch?.('')
    onRoleChange?.('')
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={searchInputRef}
            placeholder="Search users..."
            value={searchValue}
            onChange={handleSearchChange}
            className="pl-9 h-9"
            disabled={isFiltering}
          />
          {isFiltering && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select onValueChange={handleRoleFilterChange} disabled={isFiltering}>
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(isFiltered || searchValue) && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="h-9 px-2 lg:px-3"
            disabled={isFiltering}
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}

        {isPending && (
          <Badge variant="secondary" className="ml-2">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Updating...
          </Badge>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
} 