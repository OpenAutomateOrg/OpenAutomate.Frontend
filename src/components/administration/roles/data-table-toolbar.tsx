'use client'

import { X, Search, Filter } from 'lucide-react'
import React, { useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RolesDataTableToolbarProps {
  readonly searchName: string
  readonly setSearchName: (v: string) => void
  readonly searchDescription: string
  readonly setSearchDescription: (v: string) => void
  readonly searchResource: string
  readonly filterSystemRoles: string
  readonly setFilterSystemRoles: (v: string) => void
  readonly loading?: boolean
  readonly onReset: () => void
}

export function RolesDataTableToolbar({
  searchName,
  setSearchName,
  searchDescription,
  setSearchDescription,
  searchResource,
  filterSystemRoles,
  setFilterSystemRoles,
  loading = false,
  onReset,
}: RolesDataTableToolbarProps) {
  const activeFilterCount = [
    searchName,
    searchDescription,
    searchResource,
    filterSystemRoles !== 'ALL' ? filterSystemRoles : '',
  ].filter(Boolean).length

  const isFiltered = activeFilterCount > 0
  const nameInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLInputElement>(null)
  const nameCursorRef = useRef<number | null>(null)
  const descriptionCursorRef = useRef<number | null>(null)

  useEffect(() => {
    if (
      document.activeElement !== nameInputRef.current &&
      nameCursorRef.current !== null &&
      nameInputRef.current
    ) {
      nameInputRef.current.focus()
      nameInputRef.current.setSelectionRange(nameCursorRef.current, nameCursorRef.current)
    }
    if (
      document.activeElement !== descriptionInputRef.current &&
      descriptionCursorRef.current !== null &&
      descriptionInputRef.current
    ) {
      descriptionInputRef.current.focus()
      descriptionInputRef.current.setSelectionRange(
        descriptionCursorRef.current,
        descriptionCursorRef.current,
      )
    }
  }, [loading])

  return (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      {/* Name filter */}
      <div className="relative w-56">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={nameInputRef}
          placeholder="Search by name"
          value={searchName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            nameCursorRef.current = e.target.selectionStart
            setSearchName(e.target.value)
          }}
          className="pl-8 pr-8"
          disabled={loading}
          onFocus={(e) => {
            nameCursorRef.current = e.target.selectionStart
          }}
        />
        {searchName && (
          <X
            className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
            onClick={() => setSearchName('')}
          />
        )}
      </div>

      {/* Description filter */}
      <div className="relative w-56">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={descriptionInputRef}
          placeholder="Search By Description"
          value={searchDescription}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            descriptionCursorRef.current = e.target.selectionStart
            setSearchDescription(e.target.value)
          }}
          className="pl-8 pr-8"
          disabled={loading}
          onFocus={(e) => {
            descriptionCursorRef.current = e.target.selectionStart
          }}
        />
        {searchDescription && (
          <X
            className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
            onClick={() => setSearchDescription('')}
          />
        )}
      </div>

      {/* System Role filter - single select */}
      <div className="relative w-48">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Select
                value={filterSystemRoles}
                onValueChange={setFilterSystemRoles}
                disabled={loading}
              >
                <SelectTrigger className="pl-8 max-w-[180px] truncate">
                  <div className="flex items-center min-w-0">
                    <Filter className="mr-2 h-4 w-4 shrink-0" />
                    <span
                      className="truncate"
                      title={
                        filterSystemRoles !== 'ALL'
                          ? filterSystemRoles === 'SYSTEM'
                            ? 'System Roles'
                            : 'Custom Roles'
                          : 'All Roles'
                      }
                    >
                      <SelectValue placeholder="All Roles" />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="SYSTEM">System Roles</SelectItem>
                  <SelectItem value="CUSTOM">Custom Roles</SelectItem>
                </SelectContent>
              </Select>
            </TooltipTrigger>
            <TooltipContent>
              {filterSystemRoles !== 'ALL'
                ? filterSystemRoles === 'SYSTEM'
                  ? 'System Roles'
                  : 'Custom Roles'
                : 'All Roles'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {activeFilterCount > 0 && (
        <Badge variant="secondary" className="rounded-sm px-1">
          {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
        </Badge>
      )}

      {isFiltered && (
        <Button variant="ghost" onClick={onReset} className="h-8 px-2 lg:px-3" disabled={loading}>
          Reset
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
