'use client'

import { PlusCircle, Download, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns } from '@/components/automation/package/columns'
import { DataTable } from '@/components/layout/table/data-table'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { CreateEditModal } from '@/components/automation/package/create-edit-modal'
import { z } from 'zod'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { DataTableToolbar } from '@/components/automation/package/data-table-toolbar'
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
import {
  getAutomationPackagesWithOData,
  type ODataQueryOptions,
  ODataResponse,
  AutomationPackageResponseDto,
} from '@/lib/api/automation-packages'
import { useUrlParams } from '@/hooks/use-url-params'
import { Pagination } from '@/components/ui/pagination'
import useSWR from 'swr'
import { swrKeys } from '@/lib/swr-config'
import { useToast } from '@/components/ui/use-toast'

export const packageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
})

export type PackageRow = z.infer<typeof packageSchema>

export default function PackageInterface() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { updateUrl } = useUrlParams()
  const { toast } = useToast()

  // UI State management
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [totalCount, setTotalCount] = useState<number>(0)
  const totalCountRef = useRef<number>(0)
  const [isPending, setIsPending] = useState(false)
  const [isChangingPageSize, setIsChangingPageSize] = useState(false)
  const [hasExactCount, setHasExactCount] = useState(false)

  // Create refs for debouncing
  const searchDebounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const shouldInitializeUrl = useRef(true)

  // Initialize state from URL params
  const initColumnFilters = (): ColumnFiltersState => {
    const filters: ColumnFiltersState = []

    const nameFilter = searchParams.get('name')
    if (nameFilter) filters.push({ id: 'name', value: nameFilter })

    const statusFilter = searchParams.get('isActive')
    if (statusFilter) filters.push({ id: 'isActive', value: statusFilter })

    return filters
  }

  const initSorting = (): SortingState => {
    const sort = searchParams.get('sort')
    const order = searchParams.get('order')

    if (sort && (order === 'asc' || order === 'desc')) {
      return [{ id: sort, desc: order === 'desc' }]
    }

    return [{ id: 'createdAt', desc: true }] // Default sorting by creation date
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

  // Convert table state to OData query parameters
  const getODataQueryParams = useCallback((): ODataQueryOptions => {
    const params: ODataQueryOptions = {
      $top: pagination.pageSize,
      $skip: pagination.pageIndex * pagination.pageSize,
      $count: true,
      $expand: 'Versions', // Always expand versions for packages
    }

    // Add sorting
    if (sorting.length > 0) {
      params.$orderby = `${sorting[0].id} ${sorting[0].desc ? 'desc' : 'asc'}`
    }

    // Add filtering
    const filters: string[] = []

    // Name and Description filter
    const nameFilter = columnFilters.find((filter) => filter.id === 'name')
    if (nameFilter?.value) {
      const searchTerm = (nameFilter.value as string).toLowerCase();
      // Tìm kiếm cả trong name và description
      filters.push(`(contains(tolower(name), '${searchTerm}') or contains(tolower(description), '${searchTerm}'))`)
    }

    // Status filter
    const statusFilter = columnFilters.find((filter) => filter.id === 'isActive')
    if (statusFilter?.value) {
      filters.push(`isActive eq ${statusFilter.value === 'true'}`)
    }

    if (filters.length > 0) {
      params.$filter = filters.join(' and ')
    }

    return params
  }, [pagination, sorting, columnFilters])

  // SWR for packages data
  const queryParams = getODataQueryParams()
  const { 
    data: packagesResponse, 
    error: packagesError, 
    isLoading, 
    mutate: mutatePackages 
  } = useSWR(
    swrKeys.packagesWithOData(queryParams as Record<string, unknown>),
    () => getAutomationPackagesWithOData(queryParams),
    {
      onSuccess: (data) => {
        console.log('Packages data loaded:', data)
      }
    }
  )

  // Transform data during render
  const packages = useMemo(() => {
    if (!packagesResponse?.value) return []
    return packagesResponse.value
  }, [packagesResponse])

  // Handle SWR errors
  useEffect(() => {
    if (packagesError) {
      console.error('Failed to load packages:', packagesError)
      toast({
        title: 'Error',
        description: 'Failed to load packages. Please try again.',
        variant: 'destructive',
      })
    }
  }, [packagesError, toast])

  // Helper function to update counts based on OData response
  const updateTotalCounts = useCallback((response: ODataResponse<AutomationPackageResponseDto>) => {
    if (typeof response['@odata.count'] === 'number') {
      setTotalCount(response['@odata.count'])
      totalCountRef.current = response['@odata.count']
      setHasExactCount(true)
      return
    }

    if (!Array.isArray(response.value)) {
      return
    }

    // When count isn't available, estimate from current page
    const minCount = pagination.pageIndex * pagination.pageSize + response.value.length

    // Only update if the new minimum count is higher than current
    if (minCount > totalCountRef.current) {
      setTotalCount(minCount)
      totalCountRef.current = minCount
    }

    // If we got a full page, assume there might be more
    const isFullPage = response.value.length === pagination.pageSize
    if (isFullPage) {
      setTotalCount(minCount + 1) // Indicate there might be more
      totalCountRef.current = minCount + 1
    }

    setHasExactCount(false)
  }, [pagination.pageIndex, pagination.pageSize])

  // Update total count when data changes
  useEffect(() => {
    if (packagesResponse) {
      updateTotalCounts(packagesResponse)
    }
  }, [packagesResponse, updateTotalCounts])

  // Handle empty page edge case
  useEffect(() => {
    if (packagesResponse?.value) {
      const isEmptyPageBeyondFirst =
        packagesResponse.value.length === 0 && totalCountRef.current > 0 && pagination.pageIndex > 0

      if (isEmptyPageBeyondFirst) {
        const calculatedPageCount = Math.max(
          1,
          Math.ceil(totalCountRef.current / pagination.pageSize),
        )

        if (pagination.pageIndex >= calculatedPageCount) {
          setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          updateUrl(pathname, { page: '1' })
        }
      }
    }
  }, [packagesResponse, pagination.pageIndex, pagination.pageSize, totalCountRef, updateUrl, pathname])

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

  // Helper for pageCount calculation
  const getMinimumValidPageCount = (currentPageIndex: number) => {
    return currentPageIndex + 1 // Ensure current page is valid
  }

  // Calculate the standard page count based on total items and page size
  const getCalculatedPageCount = (total: number, size: number) => {
    return Math.max(1, Math.ceil(total / size))
  }

  // Calculate page count - handle case when we don't know exact count
  const pageCount = useMemo(() => {
    const calculatedCount = getCalculatedPageCount(totalCount, pagination.pageSize)

    // Check if we have a full page of results that might indicate more pages
    const hasMorePages =
      packages.length === pagination.pageSize &&
      totalCount <= pagination.pageSize * (pagination.pageIndex + 1)

    // Calculate the minimum valid page count
    const minValidPageCount = getMinimumValidPageCount(pagination.pageIndex)

    // Determine final page count
    if (hasMorePages) {
      return Math.max(minValidPageCount, calculatedCount, pagination.pageIndex + 2)
    }

    return Math.max(minValidPageCount, calculatedCount)
  }, [pagination.pageSize, pagination.pageIndex, packages.length, totalCount])

  // Helper to check if the count is a reliable total or just a minimum
  const isUnknownTotalCount = useMemo(() => {
    return !hasExactCount && packages.length === pagination.pageSize
  }, [hasExactCount, packages.length, pagination.pageSize])

  // Setup table instance
  const table = useReactTable({
    data: packages,
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
    getRowId: (row) => row.id, // Use id as the row ID
  })

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
          isActive: filterValue || null,
          page: '1', // Reset to page 1 when filter changes
        })
      }
    },
    [table, updateUrl, pathname],
  )

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimeout.current) clearTimeout(searchDebounceTimeout.current)
    }
  }, [])

  // Row click handler
  const handleRowClick = (row: AutomationPackageResponseDto) => {
    const tenantMatch = pathname.match(/^\/([^\/]+)/)
    const tenant = tenantMatch ? tenantMatch[1] : 'default'
    const route = `/${tenant}/automation/package/${row.id}`
    router.push(route)
  }

  // Refresh handler
  const handleRefresh = () => {
    setIsPending(false)
    setIsChangingPageSize(false)
    mutatePackages()
  }

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ]

  return (
    <>
      <div className="flex h-full flex-1 flex-col space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Automation Packages</h2>
          <div className="flex items-center space-x-2">
            {totalCount > 0 && (
              <div className="text-sm text-muted-foreground">
                <span>
                  Total: {totalCount} package{totalCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading || isPending}
            >
              {(isLoading || isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Refresh
            </Button>
            <Button
              onClick={() => {
                setModalMode('create')
                setIsModalOpen(true)
              }}
              className="flex items-center justify-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create
            </Button>
          </div>
        </div>
        
        <DataTableToolbar
          table={table}
          statuses={statusOptions}
          onSearch={handleSearch}
          onStatusChange={handleStatusFilterChange}
          searchValue={searchValue}
          isFiltering={isLoading}
          isPending={isPending}
        />
        
        <DataTable
          data={packages}
          columns={columns}
          onRowClick={handleRowClick}
          table={table}
          isLoading={isLoading || isPending}
          totalCount={totalCount}
        />

        <Pagination
          currentPage={pagination.pageIndex + 1}
          pageSize={pagination.pageSize}
          totalCount={totalCount}
          totalPages={pageCount}
          isLoading={isLoading || isPending}
          isChangingPageSize={isChangingPageSize}
          isUnknownTotalCount={isUnknownTotalCount}
          rowsLabel="packages"
          onPageChange={(page: number) => {
            console.log('Changing to page:', page)
            const currentPage = pagination.pageIndex + 1
            if (page !== currentPage) {
              setPagination({ ...pagination, pageIndex: page - 1 })
              updateUrl(pathname, { page: page.toString() })
            }
          }}
          onPageSizeChange={(size: number) => {
            console.log('Changing page size to:', size)
            if (size !== pagination.pageSize) {
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
            }
          }}
        />

        {!isLoading && !isPending && packages.length === 0 && !packagesError && (
          <div className="text-center py-10 text-muted-foreground">
            <p>No packages found. Create your first package to get started.</p>
          </div>
        )}
      </div>
      
      <CreateEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
        }}
        mode={modalMode}
        onSuccess={handleRefresh}
      />
    </>
  )
}
