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
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

export const usersSchema = z.object({
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  roles: z.string(),
  joinedAt: z.string(),
})

export type UsersRow = {
  email: string
  firstName: string
  lastName: string
  roles: string
  joinedAt: string
}

function mapOrganizationUnitUserToUsersRow(user: OrganizationUnitUser): UsersRow {
  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.role,
    joinedAt: new Date(user.joinedAt).toISOString().replace('T', ' ').slice(0, 16),
  }
}

const ALL_ROLES = 'ALL'
const roleOptions = ['OPERATOR', 'USER', 'DEVELOPER', 'OWNER']

export default function UsersInterface() {
  const params = useParams()
  const tenant = params.tenant as string

  const [searchEmail, setSearchEmail] = useState('')
  const [searchFirstName, setSearchFirstName] = useState('')
  const [searchLastName, setSearchLastName] = useState('')
  const [searchRole, setSearchRole] = useState('')

  const [users, setUsers] = useState<UsersRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch users with OData filter
  useEffect(() => {
    setLoading(true)
    const filters: string[] = []
    if (searchEmail) filters.push(`contains(tolower(email),'${searchEmail.toLowerCase()}')`)
    if (searchFirstName) filters.push(`contains(tolower(firstName),'${searchFirstName.toLowerCase()}')`)
    if (searchLastName) filters.push(`contains(tolower(lastName),'${searchLastName.toLowerCase()}')`)
    if (searchRole && searchRole !== ALL_ROLES) filters.push(`tolower(role) eq '${searchRole.toLowerCase()}'`)
    const odataOptions = {
      $filter: filters.length > 0 ? filters.join(' and ') : undefined,
    }
    getOrganizationUnitUsersWithOData(odataOptions)
      .then(res => setUsers(res.value.map(mapOrganizationUnitUserToUsersRow)))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false))
  }, [tenant, searchEmail, searchFirstName, searchLastName, searchRole])

  const [inviteOpen, setInviteOpen] = useState(false)
  const [tab, setTab] = useState<'user' | 'invitation'>('user')

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
          <div className="flex flex-wrap gap-2 mb-2">
            <Input placeholder="Search by Email" value={searchEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchEmail(e.target.value)} className="w-48" />
            <Input placeholder="Search by First Name" value={searchFirstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchFirstName(e.target.value)} className="w-48" />
            <Input placeholder="Search by Last Name" value={searchLastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchLastName(e.target.value)} className="w-48" />
            <Select value={searchRole} onValueChange={setSearchRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ROLES}>All Roles</SelectItem>
                {roleOptions.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setInviteOpen(true)} className="self-end mb-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Invite User
          </Button>
          <DataTable columns={columns} data={users} isLoading={loading} />
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
