'use client'

import { X, Search, Filter } from 'lucide-react'
import React, { useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { useLocale } from '@/providers/locale-provider'
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

interface UsersDataTableToolbarProps {
  readonly searchEmail: string
  readonly setSearchEmail: (v: string) => void
  readonly searchFirstName: string
  readonly setSearchFirstName: (v: string) => void
  readonly searchLastName: string
  readonly setSearchLastName: (v: string) => void
  readonly searchRole: string
  readonly setSearchRole: (v: string) => void
  readonly roleOptions: string[]
  readonly loading?: boolean
  readonly onReset: () => void
}

export function UsersDataTableToolbar({
  searchEmail,
  setSearchEmail,
  searchFirstName,
  setSearchFirstName,
  searchLastName,
  setSearchLastName,
  searchRole,
  setSearchRole,
  roleOptions,
  loading = false,
  onReset,
}: UsersDataTableToolbarProps) {
  const activeFilterCount = [
    searchEmail,
    searchFirstName,
    searchLastName,
    searchRole !== 'ALL' ? searchRole : '',
  ].filter(Boolean).length

  const isFiltered = activeFilterCount > 0
  const { t } = useLocale()
  const emailInputRef = useRef<HTMLInputElement>(null)
  const firstNameInputRef = useRef<HTMLInputElement>(null)
  const lastNameInputRef = useRef<HTMLInputElement>(null)
  const emailCursorRef = useRef<number | null>(null)
  const firstNameCursorRef = useRef<number | null>(null)
  const lastNameCursorRef = useRef<number | null>(null)

  useEffect(() => {
    if (
      document.activeElement !== emailInputRef.current &&
      emailCursorRef.current !== null &&
      emailInputRef.current
    ) {
      emailInputRef.current.focus()
      emailInputRef.current.setSelectionRange(emailCursorRef.current, emailCursorRef.current)
    }
    if (
      document.activeElement !== firstNameInputRef.current &&
      firstNameCursorRef.current !== null &&
      firstNameInputRef.current
    ) {
      firstNameInputRef.current.focus()
      firstNameInputRef.current.setSelectionRange(
        firstNameCursorRef.current,
        firstNameCursorRef.current,
      )
    }
    if (
      document.activeElement !== lastNameInputRef.current &&
      lastNameCursorRef.current !== null &&
      lastNameInputRef.current
    ) {
      lastNameInputRef.current.focus()
      lastNameInputRef.current.setSelectionRange(
        lastNameCursorRef.current,
        lastNameCursorRef.current,
      )
    }
  }, [loading])

  return (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      {/* Email filter */}
      <div className="relative w-48">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={emailInputRef}
          placeholder={t('common.search.byEmail')}
          value={searchEmail}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            emailCursorRef.current = e.target.selectionStart
            setSearchEmail(e.target.value)
          }}
          className="pl-8 pr-8"
          disabled={loading}
          onFocus={(e) => {
            emailCursorRef.current = e.target.selectionStart
          }}
        />
        {searchEmail && (
          <X
            className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
            onClick={() => setSearchEmail('')}
          />
        )}
      </div>
      {/* First Name filter */}
      <div className="relative w-48">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={firstNameInputRef}
          placeholder={t('common.search.byFirstName')}
          value={searchFirstName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            firstNameCursorRef.current = e.target.selectionStart
            setSearchFirstName(e.target.value)
          }}
          className="pl-8 pr-8"
          disabled={loading}
          onFocus={(e) => {
            firstNameCursorRef.current = e.target.selectionStart
          }}
        />
        {searchFirstName && (
          <X
            className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
            onClick={() => setSearchFirstName('')}
          />
        )}
      </div>
      {/* Last Name filter */}
      <div className="relative w-48">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={lastNameInputRef}
          placeholder={t('common.search.byLastName')}
          value={searchLastName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            lastNameCursorRef.current = e.target.selectionStart
            setSearchLastName(e.target.value)
          }}
          className="pl-8 pr-8"
          disabled={loading}
          onFocus={(e) => {
            lastNameCursorRef.current = e.target.selectionStart
          }}
        />
        {searchLastName && (
          <X
            className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
            onClick={() => setSearchLastName('')}
          />
        )}
      </div>
      {/* Role filter - single select */}
      <div className="relative w-48">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Select value={searchRole} onValueChange={setSearchRole} disabled={loading}>
                <SelectTrigger className="pl-8 max-w-[180px] truncate">
                  <div className="flex items-center min-w-0">
                    <Filter className="mr-2 h-4 w-4 shrink-0" />
                    <span
                      className="truncate"
                      title={searchRole !== 'ALL' ? searchRole : 'All Roles'}
                    >
                      <SelectValue placeholder="All Roles" />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TooltipTrigger>
            <TooltipContent>{searchRole !== 'ALL' ? searchRole : 'All Roles'}</TooltipContent>
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
