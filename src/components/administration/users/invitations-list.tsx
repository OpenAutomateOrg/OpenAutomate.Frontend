"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { organizationInvitationsApi, OrganizationInvitationResponse } from '@/lib/api/organization-unit-invitations'
import { DataTable } from '@/components/layout/table/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { MoreHorizontal, Trash } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

const invitationColumns: ColumnDef<OrganizationInvitationResponse>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value: boolean | 'indeterminate') =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value: boolean | 'indeterminate') => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => <InvitationRowActions row={row} />,
    },
    {
        accessorKey: 'recipientEmail',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
        cell: ({ row }) => <span>{row.getValue('recipientEmail')}</span>,
        enableSorting: true,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <span>{row.getValue('status')}</span>,
        enableSorting: true,
    },
    {
        accessorKey: 'expiresAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Expires At" />,
        cell: ({ row }) => {
            const date = new Date(row.getValue('expiresAt'));
            const iso = date.toISOString();
            const formatted = iso.replace('T', ' ').substring(0, 10);
            return <span>{formatted}</span>;
        },
        enableSorting: true,
    },
]

function InvitationRowActions({ row }: { readonly row: any }) {
    return (
        <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
        </Button>
    )
}

const STATUS_OPTIONS = ['All', 'Pending', 'Accepted', 'Expired', 'Revoked']

export default function InvitationsList() {
    const params = useParams()
    const tenant = params.tenant as string
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [invitations, setInvitations] = useState<OrganizationInvitationResponse[]>([])
    const [count, setCount] = useState(0)
    const [searchEmail, setSearchEmail] = useState('')
    const [searchStatus, setSearchStatus] = useState('All')
    const [pageIndex, setPageIndex] = useState(0)
    const [pageSize, setPageSize] = useState(10)

    useEffect(() => {
        setLoading(true)
        organizationInvitationsApi.listInvitations(tenant)
            .then(res => {
                let filtered = res.invitations.filter(i => i.recipientEmail.toLowerCase().includes(searchEmail.toLowerCase()))
                if (searchStatus !== 'All') {
                    filtered = filtered.filter(i => i.status === searchStatus)
                }
                setInvitations(filtered)
                setCount(filtered.length)
            })
            .catch(() => setError('Failed to load invitations'))
            .finally(() => setLoading(false))
    }, [tenant, searchEmail, searchStatus])

    const pagedInvitations = invitations.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

    return (
        <div>
            <div className="mb-2 flex items-center gap-2">
                <input
                    className="border rounded px-2 py-1"
                    placeholder="Search by email"
                    value={searchEmail}
                    onChange={e => setSearchEmail(e.target.value)}
                />
                <Select value={searchStatus} onValueChange={setSearchStatus}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="font-semibold ml-auto">Total invitations: {count}</div>
            </div>
            <DataTable
                columns={invitationColumns}
                data={pagedInvitations}
                isLoading={loading}
                totalCount={count}
            />
            <Pagination
                currentPage={pageIndex + 1}
                pageSize={pageSize}
                totalCount={count}
                totalPages={Math.max(1, Math.ceil(count / pageSize))}
                onPageChange={page => setPageIndex(page - 1)}
                onPageSizeChange={setPageSize}
            />
            {error && <div className="text-red-500">{error}</div>}
        </div>
    )
} 