'use client'

import React, { useState, useEffect } from 'react'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns } from './columns'

import { DataTable } from '@/components/layout/table/data-table'
import { InviteModal } from './invite-modal'

import { z } from 'zod'
import { useParams } from 'next/navigation'
import { OrganizationUnitUser, getOrganizationUnitUsersWithOData } from '@/lib/api/organization-unit-user'
import { UsersDataTableToolbar } from './data-table-toolbar'
import DataTableRowAction from './data-table-row-actions'
import { Pagination } from '@/components/ui/pagination'
import type { Row } from '@tanstack/react-table'

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

const ALL_ROLES = 'ALL'
const roleOptions = ['OPERATOR', 'USER', 'DEVELOPER', 'OWNER']

export default function UsersInterface() {
  const params = useParams()
  const tenant = params.tenant as string

  const [searchEmail, setSearchEmail] = useState('')
  const [searchFirstName, setSearchFirstName] = useState('')
  const [searchLastName, setSearchLastName] = useState('')
  const [searchRole, setSearchRole] = useState(ALL_ROLES)

  const [users, setUsers] = useState<OrganizationUnitUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [tab, setTab] = useState<'user' | 'invitation'>('user')

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  // Debounced filter values
  const debouncedEmail = useDebounce(searchEmail, 400)
  const debouncedFirstName = useDebounce(searchFirstName, 400)
  const debouncedLastName = useDebounce(searchLastName, 400)
  const debouncedRole = useDebounce(searchRole, 400)

  // Map API user to table row
  function mapOrganizationUnitUserToUsersRow(user: OrganizationUnitUser) {
    return {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.role,
      joinedAt: new Date(user.joinedAt).toISOString().replace('T', ' ').slice(0, 10),
    }
  }

  // Fetch users with OData filter (debounced)
  const fetchUsers = () => {
    setLoading(true)
    const filters: string[] = []
    if (debouncedEmail) filters.push(`contains(tolower(email),'${debouncedEmail.toLowerCase()}')`)
    if (debouncedFirstName) filters.push(`contains(tolower(firstName),'${debouncedFirstName.toLowerCase()}')`)
    if (debouncedLastName) filters.push(`contains(tolower(lastName),'${debouncedLastName.toLowerCase()}')`)
    if (debouncedRole && debouncedRole !== ALL_ROLES) filters.push(`tolower(role) eq '${debouncedRole.toLowerCase()}'`)
    const odataOptions = {
      $filter: filters.length > 0 ? filters.join(' and ') : undefined,
      $top: pageSize,
      $skip: pageIndex * pageSize,
      $count: true,
    }
    getOrganizationUnitUsersWithOData(odataOptions)
      .then(res => {
        setUsers(res.value)
        setTotalCount(res['@odata.count'] ?? res.value.length)
      })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, debouncedEmail, debouncedFirstName, debouncedLastName, debouncedRole, pageIndex, pageSize])

  const columnsWithAction = columns.map(col =>
    col.id === 'actions'
      ? {
        ...col,
        cell: ({ row }: { row: Row<UsersRow> }) => (
          <DataTableRowAction row={row} onDeleted={fetchUsers} />
        ),
      }
      : col
  )

  return (
    <>
      <div className="mb-4 border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            className="px-3 py-2 font-medium text-base border-b-2 border-transparent hover:border-[#FF6A00] hover:text-[#FF6A00] data-[active=true]:border-[#FF6A00] data-[active=true]:text-[#FF6A00]"
            data-active={tab === 'user'}
            type="button"
            onClick={() => setTab('user')}
          >
            User
          </button>
          <button
            className="px-3 py-2 font-medium text-base border-b-2 border-transparent hover:border-[#FF6A00] hover:text-[#FF6A00] data-[active=true]:border-[#FF6A00] data-[active=true]:text-[#FF6A00]"
            data-active={tab === 'invitation'}
            type="button"
            onClick={() => setTab('invitation')}
          >
            Invitation
          </button>
        </nav>
      </div>
      {tab === 'user' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between gap-2">
            <div className="flex-1">
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
                ALL_ROLES={ALL_ROLES}
                loading={loading}
                onReset={() => {
                  setSearchEmail('')
                  setSearchFirstName('')
                  setSearchLastName('')
                  setSearchRole(ALL_ROLES)
                }}
              />
            </div>
            <Button onClick={() => setInviteOpen(true)} className="mb-2">
              <PlusCircle className="mr-2 h-4 w-4" /> Invite User
            </Button>
          </div>
          <DataTable
            columns={columnsWithAction}
            data={users.map(mapOrganizationUnitUserToUsersRow)}
            isLoading={loading}
            totalCount={totalCount}
          />
          <Pagination
            currentPage={pageIndex + 1}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={Math.max(1, Math.ceil(totalCount / pageSize))}
            onPageChange={page => setPageIndex(page - 1)}
            onPageSizeChange={setPageSize}
          />
          {error && <div className="text-red-500">{error}</div>}
          <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
        </div>
      )}
      {tab === 'invitation' && (
        <div>Invitation feature coming soon...</div>
      )}
    </>
  )
}
