'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useMemo, useCallback } from 'react'
import useSWR from 'swr'
import { adminApi } from '@/lib/api/admin'
import { DataTable } from '@/components/layout/table/data-table'
import { userColumns } from './columns'
import { DataTableToolbar } from './data-table-toolbar'
import { Pagination } from '@/components/ui/pagination'
import { SystemRole, User } from '@/types/auth'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  PaginationState,
} from '@tanstack/react-table'

// Utility function to check if user is admin (handles both string and enum values)
const isUserAdmin = (user: User): boolean => {
  const role = user.systemRole
  // SystemRole.Admin = 1, SystemRole.User = 0
  return role === 'Admin' || role === SystemRole.Admin
}

export default function UserManagementPage() {
  // State for filtering and pagination
  const [searchValue, setSearchValue] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  // Fetch all users (system admin)
  const {
    data: users,
    error,
    isLoading,
    mutate,
  } = useSWR(['systemAdmin-all-users'], () => adminApi.getAllUsers())

  // Filter users based on search and role filter
  const filteredUsers = useMemo(() => {
    if (!users) return []

    let filtered = users

    // Search filter
    if (searchValue) {
      filtered = filtered.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(searchValue.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchValue.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchValue.toLowerCase()),
      )
    }

    // Role filter
    if (roleFilter) {
      filtered = filtered.filter((user) => {
        const isAdmin = isUserAdmin(user)
        return roleFilter === 'Admin' ? isAdmin : !isAdmin
      })
    }

    return filtered
  }, [users, searchValue, roleFilter])

  // Setup table instance
  const table = useReactTable({
    data: filteredUsers,
    columns: userColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: false,
  })

  // Calculate total count for pagination
  const totalCount = filteredUsers.length
  const pageCount = Math.max(1, Math.ceil(totalCount / pagination.pageSize))

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 })) // Reset to first page
  }, [])

  // Handle role filter
  const handleRoleFilterChange = useCallback((value: string) => {
    setRoleFilter(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 })) // Reset to first page
  }, [])

  // Role options for filter
  const roleOptions = [
    { value: 'Admin', label: 'Admin' },
    { value: 'User', label: 'User' },
  ]

  return (
    <div className="h-full overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="text-muted-foreground">Manage system users and their permissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">2,847</div>
              <p className="text-xs text-muted-foreground">+12.5% from last month</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">2,234</div>
              <p className="text-xs text-muted-foreground">+8.1% from last month</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                Pending Invites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">156</div>
              <p className="text-xs text-muted-foreground">+3.2% from last month</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                Inactive Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">457</div>
              <p className="text-xs text-muted-foreground">-2.1% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300">
              Failed to load users. Please try again.
            </p>
            <Button variant="outline" className="mt-2" onClick={() => mutate()}>
              Retry
            </Button>
          </div>
        )}

        {/* Users Table Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Users</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataTableToolbar
              table={table}
              roles={roleOptions}
              onSearch={handleSearch}
              onRoleChange={handleRoleFilterChange}
              searchValue={searchValue}
              isFiltering={isLoading}
              isPending={false}
            />

            <DataTable
              columns={userColumns}
              data={filteredUsers}
              table={table}
              isLoading={isLoading}
              totalCount={totalCount}
            />

            <Pagination
              currentPage={pagination.pageIndex + 1}
              pageSize={pagination.pageSize}
              totalCount={totalCount}
              totalPages={pageCount}
              isLoading={isLoading}
              isChangingPageSize={false}
              isUnknownTotalCount={false}
              onPageChange={(page: number) => {
                setPagination({ ...pagination, pageIndex: page - 1 })
              }}
              onPageSizeChange={(size: number) => {
                const currentStartRow = pagination.pageIndex * pagination.pageSize
                const newPageIndex = Math.floor(currentStartRow / size)
                setPagination({
                  pageSize: size,
                  pageIndex: newPageIndex,
                })
              }}
            />

            {!isLoading && filteredUsers.length === 0 && !error && (
              <div className="text-center py-10 text-muted-foreground">
                <p>
                  No users found.{' '}
                  {searchValue || roleFilter
                    ? 'Try adjusting your filters.'
                    : 'Create your first user to get started.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
