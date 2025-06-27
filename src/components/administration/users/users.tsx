'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns } from './columns'

import { DataTable } from '@/components/layout/table/data-table'
import { InviteModal } from './invite-modal'
import InvitationsList from './invitations-list'

import { z } from 'zod'
import {
  OrganizationUnitUser,
  getOrganizationUnitUsersWithOData,
  organizationUnitUserApi,
  AuthorityDto,
} from '@/lib/api/organization-unit-user'
import { UsersDataTableToolbar } from './data-table-toolbar'
import DataTableRowAction from './data-table-row-actions'
import { Pagination } from '@/components/ui/pagination'
import type { ColumnDef, Row } from '@tanstack/react-table'
import useSWR from 'swr'

export const usersSchema = z.object({
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  roles: z.string(),
  joinedAt: z.string(),
})

export type UsersRow = {
  userId: string
  email: string
  firstName: string
  lastName: string
  roles: string
  joinedAt: string
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function UsersInterface() {
  const [searchEmail, setSearchEmail] = useState('')
  const [searchFirstName, setSearchFirstName] = useState('')
  const [searchLastName, setSearchLastName] = useState('')
  const [searchRole, setSearchRole] = useState<string>('ALL')

  const [inviteOpen, setInviteOpen] = useState(false)
  const [tab, setTab] = useState<'user' | 'invitation'>('user')

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Refs for tracking total count
  const totalCountRef = useRef<number>(0)
  const [hasExactCount, setHasExactCount] = useState(false)

  // Debounced filter values
  const debouncedEmail = useDebounce(searchEmail, 400)
  const debouncedFirstName = useDebounce(searchFirstName, 400)
  const debouncedLastName = useDebounce(searchLastName, 400)

  const tenant = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : ''
  const { data: allRoles } = useSWR<AuthorityDto[]>(tenant ? `ou-roles-${tenant}` : null, () =>
    organizationUnitUserApi.getRolesInOrganizationUnit(tenant),
  )
  const roleOptions = useMemo(() => {
    if (!allRoles) return []
    // Deduplicate by name (case-insensitive)
    const unique = new Map<string, string>()
    for (const role of allRoles) {
      const key = role.name.trim().toLowerCase()
      if (!unique.has(key)) {
        unique.set(key, role.name)
      }
    }
    return Array.from(unique.values())
  }, [allRoles])

  // Build OData options for SWR key
  const odataOptions = {
    $filter:
      [
        debouncedEmail ? `contains(tolower(email),'${debouncedEmail.toLowerCase()}')` : undefined,
        debouncedFirstName
          ? `contains(tolower(firstName),'${debouncedFirstName.toLowerCase()}')`
          : undefined,
        debouncedLastName
          ? `contains(tolower(lastName),'${debouncedLastName.toLowerCase()}')`
          : undefined,
        searchRole !== 'ALL'
          ? `roles/any(r: tolower(r) eq '${searchRole.toLowerCase()}')`
          : undefined,
      ]
        .filter(Boolean)
        .join(' and ') || undefined,
    $top: pageSize,
    $skip: pageIndex * pageSize,
    $count: true,
  }

  // SWR for users data
  const {
    data: usersResponse,
    error,
    isLoading,
    mutate,
  } = useSWR(
    ['organization-unit-users', odataOptions],
    () => getOrganizationUnitUsersWithOData(odataOptions),
    { keepPreviousData: true },
  )

  const users = usersResponse?.value ?? []
  const totalCount = usersResponse?.['@odata.count'] ?? users.length

  // Update total count based on OData response
  useEffect(() => {
    if (usersResponse) {
      if (typeof usersResponse['@odata.count'] === 'number') {
        totalCountRef.current = usersResponse['@odata.count']
        setHasExactCount(true)
      } else {
        // If no @odata.count, use length as minimum count
        const minCount = pageIndex * pageSize + users.length
        if (minCount > totalCountRef.current) {
          totalCountRef.current = minCount
        }

        // If we have a full page and we're on the first page, assume there's at least one more
        const isFullFirstPage = users.length === pageSize && pageIndex === 0
        if (isFullFirstPage) {
          totalCountRef.current = minCount + 1
        }

        setHasExactCount(false)
      }
    }
  }, [usersResponse, pageIndex, pageSize, users.length])

  // Calculate page count with better edge case handling
  const totalPages = useMemo(() => {
    const calculatedCount = Math.max(1, Math.ceil(totalCount / pageSize))
    const hasMorePages = users.length === pageSize && totalCount <= pageSize * (pageIndex + 1)
    const minValidPageCount = pageIndex + 1

    if (hasMorePages) {
      return Math.max(minValidPageCount, calculatedCount, pageIndex + 2)
    }
    return Math.max(minValidPageCount, calculatedCount)
  }, [totalCount, pageSize, pageIndex, users.length])

  const isUnknownTotalCount = !hasExactCount && users.length === pageSize

  // Map API user to table row
  function mapOrganizationUnitUserToUsersRow(user: OrganizationUnitUser) {
    return {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: Array.isArray(user.roles) ? user.roles.join(', ') : '',
      joinedAt: new Date(user.joinedAt).toISOString().replace('T', ' ').slice(0, 10),
    }
  }

  // Error state for display
  const [localError, setLocalError] = useState<string | null>(null)
  useEffect(() => {
    if (error) setLocalError('Failed to load users')
    else setLocalError(null)
  }, [error])

  // Fix for the TypeScript warning about row prop
  const columnsWithAction: ColumnDef<UsersRow>[] = columns.map((col) =>
    col.id === 'actions'
      ? {
          ...col,
          cell: ({ row }: { row: Row<UsersRow> }) => (
            <DataTableRowAction row={row} onDeleted={mutate} />
          ),
        }
      : col,
  )

  return (
    <div className="flex flex-col h-full w-full space-y-8">
      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200 w-full">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            className="px-3 py-2 font-medium text-sm border-b-2 border-transparent hover:border-primary hover:text-primary data-[active=true]:border-primary data-[active=true]:text-primary"
            data-active={tab === 'user'}
            type="button"
            onClick={() => setTab('user')}
          >
            User
          </button>
          <button
            className="px-3 py-2 font-medium text-sm border-b-2 border-transparent hover:border-primary hover:text-primary data-[active=true]:border-primary data-[active=true]:text-primary"
            data-active={tab === 'invitation'}
            type="button"
            onClick={() => setTab('invitation')}
          >
            Invitation
          </button>
        </nav>
      </div>

      {tab === 'user' && (
        <>
          <div className="flex justify-between items-center w-full flex-wrap gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Users</h2>
            <div className="flex items-center space-x-2">
              {totalCount > 0 && (
                <div className="text-sm text-muted-foreground">
                  <span>
                    Total: {totalCount} user{totalCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <Button
                onClick={() => setInviteOpen(true)}
                className="flex items-center justify-center"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Invite User
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <UsersDataTableToolbar
              searchEmail={searchEmail}
              setSearchEmail={setSearchEmail}
              searchFirstName={searchFirstName}
              setSearchFirstName={setSearchFirstName}
              searchLastName={searchLastName}
              setSearchLastName={setSearchLastName}
              searchRole={searchRole}
              setSearchRole={setSearchRole}
              roleOptions={roleOptions}
              loading={isLoading}
              onReset={() => {
                setSearchEmail('')
                setSearchFirstName('')
                setSearchLastName('')
                setSearchRole('ALL')
              }}
            />
            <DataTable
              columns={columnsWithAction}
              data={users.map(mapOrganizationUnitUserToUsersRow)}
              isLoading={isLoading}
              totalCount={totalCount}
            />
            <Pagination
              currentPage={pageIndex + 1}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              isUnknownTotalCount={isUnknownTotalCount}
              onPageChange={(page) => setPageIndex(page - 1)}
              onPageSizeChange={setPageSize}
            />
            {localError && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
                <p className="text-red-800 dark:text-red-300">{localError}</p>
                <Button variant="outline" className="mt-2" onClick={() => mutate()}>
                  Retry
                </Button>
              </div>
            )}
            {!isLoading && users.length === 0 && !localError && (
              <div className="text-center py-10 text-muted-foreground">
                <p>No users found.</p>
              </div>
            )}
            <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
          </div>
        </>
      )}
      {tab === 'invitation' && <InvitationsList />}
    </div>
  )
}
