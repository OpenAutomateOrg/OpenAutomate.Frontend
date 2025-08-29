'use client'

import { PlusCircle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CreatePackageColumns } from '@/components/automation/package/columns'
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
  AutomationPackageResponseDto,
  deleteAutomationPackage,
  bulkDeleteAutomationPackages,
} from '@/lib/api/automation-packages'
import { useUrlParams } from '@/hooks/use-url-params'
import { Pagination } from '@/components/ui/pagination'
import useSWR from 'swr'
import { swrKeys } from '@/lib/config/swr-config'
import { useToast } from '@/components/ui/use-toast'
import { useLocale } from '@/providers/locale-provider'

export const packageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
})

export type PackageRow = z.infer<typeof packageSchema>

export default function PackageInterface() {
  const { t } = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { updateUrl } = useUrlParams()
  const { toast } = useToast()

  // UI State management
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
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

  // ✅ Convert table state to OData query parameters (following guideline #1: derive data during render)
  const getODataQueryParams = useCallback((): ODataQueryOptions => {
    const params: ODataQueryOptions = {
      $top: pagination.pageSize,
      $skip: pagination.pageIndex * pagination.pageSize,
      $count: true,
      $expand: 'Versions', // Always expand versions for packages
    }

    // Add sorting
    if (sorting.length > 0) {
      params.$orderby = sorting.map((sort) => `${sort.id} ${sort.desc ? 'desc' : 'asc'}`).join(',')
    }

    // Add filtering
    if (columnFilters.length > 0) {
      const filters = columnFilters
        .filter((filter) => !(typeof filter.value === 'string' && filter.value === ''))
        .map((filter) => {
          const column = filter.id
          const value = filter.value

          if (typeof value === 'string') {
            if (column === 'name' && value) {
              return `(contains(tolower(name), '${value.toLowerCase()}') or contains(tolower(description), '${value.toLowerCase()}'))`
            }
            if (column === 'isActive') {
              return `isActive eq ${value === 'true'}`
            }
            return `contains(tolower(${column}), '${value.toLowerCase()}')`
          } else if (Array.isArray(value)) {
            return value.map((v) => `${column} eq '${v}'`).join(' or ')
          }

          return ''
        })
        .filter(Boolean)

      if (filters.length > 0) {
        params.$filter = filters.join(' and ')
      }
    }

    return params
  }, [pagination, sorting, columnFilters])

  // ✅ SWR for packages data - following guideline #8: use framework-level loaders
  const queryParams = getODataQueryParams()
  const {
    data: packagesResponse,
    error: packagesError,
    isLoading,
    mutate: mutatePackages,
  } = useSWR(swrKeys.packagesWithOData(queryParams as Record<string, unknown>), () =>
    getAutomationPackagesWithOData(queryParams),
  )

  // ✅ Transform data during render (following guideline #1: prefer deriving data during render)
  const packages = useMemo(() => {
    if (!packagesResponse?.value) return []
    return packagesResponse.value
  }, [packagesResponse])

  // ✅ Handle SWR errors (following guideline #3: error handling in dedicated effects)
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

  // ✅ Update total count when data changes (following guideline #1: derive data during render)
  // Client-only: Requires state updates for pagination
  useEffect(() => {
    if (!packagesResponse) return

    const response = packagesResponse

    // Handle exact count from OData
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

    // If we got a full page on first page, assume there might be more
    const isFullFirstPage =
      response.value.length === pagination.pageSize && pagination.pageIndex === 0
    if (isFullFirstPage) {
      setTotalCount(minCount + 1) // Indicate there might be more
      totalCountRef.current = minCount + 1
    }

    setHasExactCount(false)
  }, [packagesResponse, pagination.pageIndex, pagination.pageSize])

  // ✅ Handle empty page edge case (following guideline #1: derive data during render)
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
  }, [
    packagesResponse,
    pagination.pageIndex,
    pagination.pageSize,
    totalCountRef,
    updateUrl,
    pathname,
  ])

  // ✅ Refresh handler using SWR mutate (following guideline #8: use framework-level loaders)
  const refreshPackages = useCallback(async () => {
    setIsPending(false)
    setIsChangingPageSize(false)
    await mutatePackages()
  }, [mutatePackages])

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

  // Setup table instance with optimized configuration
  const table = useReactTable({
    data: packages,
    columns: CreatePackageColumns(refreshPackages),
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
      }, 300) // Giảm thời gian debounce xuống 300ms để cảm giác mượt mà hơn
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

  // Delete handlers
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    const selectedPackageIds = Object.keys(rowSelection)

    if (selectedPackageIds.length === 0) {
      return
    }

    try {
      // Use bulk delete if multiple packages, single delete if one package
      if (selectedPackageIds.length > 1) {
        await bulkDeleteAutomationPackages(selectedPackageIds)
      } else {
        await deleteAutomationPackage(selectedPackageIds[0])
      }

      // Show success toast
      toast({
        title: 'Packages Deleted',
        description: `Successfully deleted ${selectedPackageIds.length} package(s).`,
        duration: 3000,
      })

      // Clear selection and close dialog
      setRowSelection({})
      setDeleteDialogOpen(false)

      // Refresh data
      await mutatePackages()
    } catch (error) {
      console.error('Failed to delete packages:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete packages. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const statusOptions = [
    { value: 'all', label: 'Show All' },
    { value: 'true', label: t('package.status.active') },
    { value: 'false', label: t('package.status.inactive') },
  ]

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">{t('package.title')}</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={refreshPackages} disabled={isLoading || isPending}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('package.refresh')}
            </Button>
            <Button
              onClick={() => {
                setModalMode('create')
                setIsModalOpen(true)
              }}
              className="flex items-center justify-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('package.create')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              className="flex items-center justify-center"
              disabled={Object.keys(rowSelection).length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>

        {packagesError && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300">{t('package.loadError')}</p>
            <Button variant="outline" className="mt-2" onClick={() => mutatePackages()}>
              {t('package.retry')}
            </Button>
          </div>
        )}

        <DataTableToolbar
          table={table}
          statuses={statusOptions}
          onSearch={handleSearch}
          onStatusChange={handleStatusFilterChange}
          searchValue={searchValue}
          isFiltering={isLoading}
          isPending={isPending}
          totalCount={totalCount}
        />

        <DataTable
          data={packages}
          columns={CreatePackageColumns(refreshPackages)}
          onRowClick={handleRowClick}
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
          isChangingPageSize={isChangingPageSize}
          isUnknownTotalCount={isUnknownTotalCount}
          rowsLabel={t('package.rowsLabel')}
          onPageChange={(page: number) => {
            const currentPage = pagination.pageIndex + 1
            if (page !== currentPage) {
              setPagination({ ...pagination, pageIndex: page - 1 })
              updateUrl(pathname, { page: page.toString() })
            }
          }}
          onPageSizeChange={(size: number) => {
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
      </div>

      <CreateEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
        }}
        mode={modalMode}
        onSuccess={refreshPackages}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Packages</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {Object.keys(rowSelection).length} selected
              package(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
