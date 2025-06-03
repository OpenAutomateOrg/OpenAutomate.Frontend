'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns } from './columns'

import { DataTable } from '@/components/layout/table/data-table'
import { useState, useEffect } from 'react'
import { InviteModal } from './invite-modal'

import { z } from 'zod'
import { useParams } from 'next/navigation'
import { organizationUnitUserApi, OrganizationUnitUser } from '@/lib/api/organization-unit-user'

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

export default function UsersInterface() {
  const params = useParams()
  const tenant = params.tenant as string

  // State cho tab User
  const [users, setUsers] = useState<UsersRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    organizationUnitUserApi.getUsers(tenant)
      .then(data => setUsers(data.map(mapOrganizationUnitUserToUsersRow)))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false))
  }, [tenant])

  // State cho tab Invitation
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
