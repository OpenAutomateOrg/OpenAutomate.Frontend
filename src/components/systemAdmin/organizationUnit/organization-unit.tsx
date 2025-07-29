'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { columns } from './columns'

import { DataTable } from '@/components/layout/table/data-table'
import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { DataTableToolbar } from './data-table-toolbar'
import type { OrganizationUnit } from '@/types/organization'

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
import { adminApi } from '@/lib/api/admin'
import { useUrlParams } from '@/hooks/use-url-params'
import { Pagination } from '@/components/ui/pagination'

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
    </div>
  )
}

function OrganizationUnitAdminInterfaceContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { updateUrl } = useUrlParams()

  const [data, setData] = useState<OrganizationUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [isPending, setIsPending] = useState(false)
  const [isChangingPageSize, setIsChangingPageSize] = useState(false)

  // Create refs for debouncing
  const searchDebounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const shouldInitializeUrl = useRef(true)

  // Initialize state from URL params
  const initColumnFilters = (): ColumnFiltersState => {
    const filters: ColumnFiltersState = []

    const nameFilter = searchParams.get('name')
    if (nameFilter) filters.push({ id: 'name', value: nameFilter })

    const statusFilter = searchParams.get('status')
    if (statusFilter) filters.push({ id: 'isActive', value: statusFilter })

    return filters
  }

  const initSorting = (): SortingState => {
    const sort = searchParams.get('sort')
    const order = searchParams.get('order')

    if (sort && (order === 'asc' || order === 'desc')) {
      return [{ id: sort, desc: order === 'desc' }]
    }

    return []
  }

  const initPagination = (): PaginationState => {
    const page = searchParams.get('page')
    const size = searchParams.get('size')

    return {
      pageIndex: page ? Math.max(0, parseInt(page) - 1) : 0,
      pageSize: size ? parseInt(size) : 10,
    }
  }

  // State from URL
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initColumnFilters)
  const [sorting, setSorting] = useState<SortingState>(initSorting)
  const [pagination, setPagination] = useState<PaginationState>(initPagination)

  // UI state for search input
  const [searchValue, setSearchValue] = useState<string>(searchParams.get('name') ?? '')

  // Fetch organization units
  const fetchOrganizationUnits = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const organizationUnits = await adminApi.getAllOrganizationUnits()
      setData(organizationUnits)
    } catch (err) {
      setError('Failed to fetch organization units')
      console.error('Error fetching organization units:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch organization units on component mount
  useEffect(() => {
    fetchOrganizationUnits()
  }, [fetchOrganizationUnits])

  // Sort comparison function
  const sortData = (a: OrganizationUnit, b: OrganizationUnit, sort: { id: string; desc: boolean }) => {
    let aValue = a[sort.id as keyof OrganizationUnit]
    let bValue = b[sort.id as keyof OrganizationUnit]

    // Normalize string values
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    // Handle null/undefined values first
    if (aValue === null || aValue === undefined) {
      if (bValue === null || bValue === undefined) return 0
      return sort.desc ? 1 : -1
    }
    if (bValue === null || bValue === undefined) {
      return sort.desc ? -1 : 1
    }

    // Compare values
    let comparison = 0
    if (aValue < bValue) {
      comparison = -1
    } else if (aValue > bValue) {
      comparison = 1
    }
    return sort.desc ? -comparison : comparison
  }

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    let filtered = [...data]

    columnFilters.forEach((filter) => {
      if (filter.id === 'name' && filter.value) {
        const searchTerm = (filter.value as string).toLowerCase()
        filtered = filtered.filter(
          (item) =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.slug.toLowerCase().includes(searchTerm)
        )
      }

      if (filter.id === 'isActive' && filter.value) {
        const isActiveFilter = filter.value === 'true'
        filtered = filtered.filter((item) => item.isActive === isActiveFilter)
      }
    })

    // Apply sorting
    if (sorting.length > 0) {
      const sort = sorting[0]
      filtered.sort((a, b) => sortData(a, b, sort))
    }

    return filtered
  }, [data, columnFilters, sorting])

  // Calculate pagination
  const totalCount = filteredData.length
  const pageCount = Math.max(1, Math.ceil(totalCount / pagination.pageSize))
  const paginatedData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    const end = start + pagination.pageSize
    return filteredData.slice(start, end)
  }, [filteredData, pagination])

  const table = useReactTable({
    data: paginatedData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(newSorting)
      if (newSorting.length > 0) {
        updateUrl(pathname, {
          sort: newSorting[0].id,
          order: newSorting[0].desc ? 'desc' : 'asc',
          page: '1', // Reset to first page when sorting changes
        })
      } else {
        updateUrl(pathname, {
          sort: null,
          order: null,
          page: '1',
        })
      }
      setPagination(prev => ({ ...prev, pageIndex: 0 }))
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater
      setPagination(newPagination)
      updateUrl(pathname, {
        page: (newPagination.pageIndex + 1).toString(),
        size: newPagination.pageSize.toString(),
      })
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    pageCount,
    manualSorting: true,
    manualFiltering: true,
  })

  const handleRowClick = (row: OrganizationUnit) => {
    const route = `/org-unit-management/${row.id}`
    router.push(route)
  }

  // Calculate statistics
  const totalUnits = data.length
  const activeUnits = data.filter(unit => unit.isActive).length
  const inactiveUnits = totalUnits - activeUnits

  const handleRetry = useCallback(() => {
    fetchOrganizationUnits()
  }, [fetchOrganizationUnits])

  // Initialize URL with default params if needed
  useEffect(() => {
    if (shouldInitializeUrl.current) {
      shouldInitializeUrl.current = false

      const page = searchParams.get('page')
      const size = searchParams.get('size')

      if (!page || !size) {
        updateUrl(pathname, {
          page: page ?? '1',
          size: size ?? '10',
        })
      }
    }
  }, [searchParams, updateUrl, pathname])

  // Implement search with debounce
  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      setIsPending(true)

      if (searchDebounceTimeout.current) clearTimeout(searchDebounceTimeout.current)

      searchDebounceTimeout.current = setTimeout(() => {
        const nameFilter = table.getColumn('name')

        if (nameFilter) {
          nameFilter.setFilterValue(value)

          updateUrl(pathname, {
            name: value || null,
            page: '1', // Reset to first page when filter changes
          })
        }

        setPagination(prev => ({ ...prev, pageIndex: 0 }))
        setIsPending(false)
      }, 500)
    },
    [table, updateUrl, pathname],
  )

  // Handle status filter change
  const handleStatusFilterChange = useCallback(
    (value: string) => {
      const statusColumn = table.getColumn('isActive')

      if (statusColumn) {
        const filterValue = value === 'all' ? '' : value
        statusColumn.setFilterValue(filterValue)

        updateUrl(pathname, {
          status: filterValue || null,
          page: '1', // Reset to page 1 when filter changes
        })
      }
      setPagination(prev => ({ ...prev, pageIndex: 0 }))
    },
    [table, updateUrl, pathname],
  )

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimeout.current) clearTimeout(searchDebounceTimeout.current)
    }
  }, [])

  return (
    <div className="h-full overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Organization Units
          </h1>
          <p className="text-muted-foreground">Manage organization units and their structure</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Total Organization Units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{totalUnits}</div>
              <p className="text-xs text-muted-foreground">Organization units managed</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Active Organization Units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{activeUnits}</div>
              <p className="text-xs text-muted-foreground">Currently operational</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Inactive Organization Units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{inactiveUnits}</div>
              <p className="text-xs text-muted-foreground">Pending deletion</p>
            </CardContent>
          </Card>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300">{error}</p>
            <Button variant="outline" className="mt-2" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        )}

        {/* Organization Units Table Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Organization Units</CardTitle>
                {totalCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Total: {totalCount} unit{totalCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataTableToolbar
              table={table}
              statuses={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              onSearch={handleSearch}
              onStatusChange={handleStatusFilterChange}
              searchValue={searchValue}
              isFiltering={loading}
              isPending={isPending}
            />

            <DataTable
              data={paginatedData}
              columns={columns}
              onRowClick={handleRowClick}
              table={table}
              isLoading={loading}
              totalCount={totalCount}
            />

            <Pagination
              currentPage={pagination.pageIndex + 1}
              pageSize={pagination.pageSize}
              totalCount={totalCount}
              totalPages={pageCount}
              isLoading={loading}
              isChangingPageSize={isChangingPageSize}
              isUnknownTotalCount={false}
              onPageChange={(page: number) => {
                setPagination({ ...pagination, pageIndex: page - 1 })
                updateUrl(pathname, { page: page.toString() })
              }}
              onPageSizeChange={(size: number) => {
                setIsChangingPageSize(true)
                const currentStartRow = pagination.pageIndex * pagination.pageSize
                const newPageIndex = Math.floor(currentStartRow / size)

                setPagination({
                  pageSize: size,
                  pageIndex: newPageIndex,
                })

                updateUrl(pathname, {
                  size: size.toString(),
                  page: (newPageIndex + 1).toString(),
                })

                // Reset the changing page size state
                setTimeout(() => setIsChangingPageSize(false), 100)
              }}
            />

            {!loading && paginatedData.length === 0 && !error && (
              <div className="text-center py-10 text-muted-foreground">
                <p>No organization units found. {searchValue || columnFilters.some(f => f.id === 'isActive' && f.value) ? 'Try adjusting your filters.' : 'No units available.'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main component with Suspense wrapper for useSearchParams
export default function OrganizationUnitAdminInterface() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrganizationUnitAdminInterfaceContent />
    </Suspense>
  )
}