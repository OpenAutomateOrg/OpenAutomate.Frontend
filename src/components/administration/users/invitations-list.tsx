"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PlusCircle, Search, X, Filter } from 'lucide-react'
import { organizationInvitationsApi, OrganizationInvitationResponse } from '@/lib/api/organization-unit-invitations'
import { DataTable } from '@/components/layout/table/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { MoreHorizontal } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/layout/table/data-table-column-header'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { InviteModal } from './invite-modal'
import useSWR from 'swr'

const invitationColumns: ColumnDef<OrganizationInvitationResponse>[] = [
    {
        id: 'select',
        header: ({ table }: { table: any }) => (
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
        cell: ({ row }: { row: any }) => (
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
        cell: ({ row }: { row: any }) => <InvitationRowActions row={row} />,
    },
    {
        accessorKey: 'recipientEmail',
        header: ({ column }: { column: any }) => <DataTableColumnHeader column={column} title="Email" />,
        cell: ({ row }: { row: any }) => <span>{row.getValue('recipientEmail')}</span>,
        enableSorting: true,
    },
    {
        accessorKey: 'status',
        header: ({ column }: { column: any }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }: { row: any }) => <span>{row.getValue('status')}</span>,
        enableSorting: true,
    },
    {
        accessorKey: 'expiresAt',
        header: ({ column }: { column: any }) => <DataTableColumnHeader column={column} title="Expires At" />,
        cell: ({ row }: { row: any }) => {
            try {
                const dateValue = row.getValue('expiresAt');
                if (!dateValue) return <span>-</span>;

                // Format date the same way as in users.tsx
                const date = new Date(dateValue);
                if (isNaN(date.getTime())) return <span>Invalid date</span>;

                return <span>{date.toISOString().replace('T', ' ').slice(0, 10)}</span>;
            } catch (error) {
                console.error('Error formatting date:', error);
                return <span>Error</span>;
            }
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
    const [searchEmail, setSearchEmail] = useState('')
    const [searchStatus, setSearchStatus] = useState('All')
    const [pageIndex, setPageIndex] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [inviteOpen, setInviteOpen] = useState(false)

    // Refs for input cursor position tracking
    const emailInputRef = useRef<HTMLInputElement>(null)
    const emailCursorRef = useRef<number | null>(null)

    // Build OData filter
    const odataFilter = [
        searchEmail ? `contains(tolower(recipientEmail),'${searchEmail.toLowerCase()}')` : undefined,
        searchStatus !== 'All' ? `status eq '${searchStatus}'` : undefined,
    ].filter(Boolean).join(' and ');

    const odataOptions = {
        $filter: odataFilter || undefined,
        $top: pageSize,
        $skip: pageIndex * pageSize,
        $count: true,
    };

    // SWR fetch invitations with OData
    const { data, error, isLoading, mutate } = useSWR(
        ['organization-invitations', tenant, odataOptions],
        () => organizationInvitationsApi.listInvitations(tenant, odataOptions)
    );

    // Restore cursor position after re-rendering
    useEffect(() => {
        if (
            document.activeElement !== emailInputRef.current &&
            emailCursorRef.current !== null &&
            emailInputRef.current
        ) {
            emailInputRef.current.focus()
            emailInputRef.current.setSelectionRange(emailCursorRef.current, emailCursorRef.current)
        }
    }, [isLoading]);

    const invitations = data?.value ?? [];
    const count = data?.['@odata.count'] ?? invitations.length;

    // Check for active filters
    const isFiltered = searchEmail || searchStatus !== 'All';
    const activeFilterCount = [
        searchEmail,
        searchStatus !== 'All' ? searchStatus : '',
    ].filter(Boolean).length;

    // Reset all filters
    const resetFilters = () => {
        setSearchEmail('');
        setSearchStatus('All');
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    {/* Email filter */}
                    <div className="relative w-48">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            ref={emailInputRef}
                            placeholder="Search by Email"
                            value={searchEmail}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                emailCursorRef.current = e.target.selectionStart;
                                setSearchEmail(e.target.value);
                            }}
                            className="pl-8 pr-8"
                            disabled={isLoading}
                            onFocus={(e) => {
                                emailCursorRef.current = e.target.selectionStart;
                            }}
                        />
                        {searchEmail && (
                            <X
                                className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
                                onClick={() => setSearchEmail('')}
                            />
                        )}
                    </div>

                    {/* Status filter */}
                    <div className="relative w-48">
                        <Select value={searchStatus} onValueChange={setSearchStatus} disabled={isLoading}>
                            <SelectTrigger className="pl-8">
                                <div className="flex items-center">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Filter Status" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Statuses</SelectItem>
                                {STATUS_OPTIONS.filter(s => s !== 'All').map(option => (
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Active filter count badge */}
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="rounded-sm px-1">
                            {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
                        </Badge>
                    )}

                    {/* Reset filters button */}
                    {isFiltered && (
                        <Button variant="ghost" onClick={resetFilters} className="h-8 px-2 lg:px-3" disabled={isLoading}>
                            Reset
                            <X className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Invite User button */}
                <Button onClick={() => setInviteOpen(true)} className="mb-2">
                    <PlusCircle className="mr-2 h-4 w-4" /> Invite User
                </Button>
            </div>

            <DataTable
                columns={invitationColumns}
                data={invitations}
                isLoading={isLoading}
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

            {error && <div className="text-red-500">Failed to load invitations</div>}

            {/* Invite User Modal */}
            <InviteModal isOpen={inviteOpen} onClose={() => {
                setInviteOpen(false);
                mutate(); // Refresh data after invitation
            }} />
        </div>
    )
} 