'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createColumns } from './columns'
import { DataTable } from '@/components/layout/table/data-table'
import { CreateEditModal } from '@/components/asset/create-edit-modal'
import { z } from 'zod'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { DataTableToolbar } from './data-table-toolbar'
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
  ColumnFilter,
} from '@tanstack/react-table'
import {
  getAssetsWithOData,
  type ODataQueryOptions,
  getAssetDetail,
  getAssetAgents,
} from '@/lib/api/assets'
import { useUrlParams } from '@/hooks/use-url-params'
import { Pagination } from '@/components/ui/pagination'
import useSWR from 'swr'
import { swrKeys } from '@/lib/config/swr-config'
import { useToast } from '@/components/ui/use-toast'
import { useLocale } from '@/providers/locale-provider'

export const assetSchema = z.object({
  id: z.string(),
  key: z.string(),
  type: z.union([z.number(), z.string()]), // Allow both number and string
  description: z.string(),
  createdBy: z.string(),
})

export type AssetRow = z.infer<typeof assetSchema>
export type AssetEditRow = AssetRow & { value?: string; agents?: { id: string; name: string }[] }

export default function AssetInterface() {
  const { t } = useLocale()
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
  const searchDebounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const [hasExactCount, setHasExactCount] = useState(false)
  const getCalculatedPageCount = (total: number, size: number) =>
    Math.max(1, Math.ceil(total / size))
  const getMinimumValidPageCount = (currentPageIndex: number) => currentPageIndex + 1
  const initColumnFilters = (): ColumnFiltersState => {
    const filters: ColumnFiltersState = []

    const keyFilter = searchParams.get('key')
    if (keyFilter) filters.push({ id: 'key', value: keyFilter })

    const typeFilter = searchParams.get('type')
    if (typeFilter) filters.push({ id: 'type', value: typeFilter })

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
    const pageParam = searchParams.get('page')
    const sizeParam = searchParams.get('size')

    const pageIndex = pageParam ? Math.max(0, parseInt(pageParam, 10) - 1) : 0
    const pageSize = sizeParam ? parseInt(sizeParam, 10) : 10

    return { pageIndex, pageSize }
  }

  // State for search, filters, sorting, and pagination
  const [searchValue, setSearchValue] = useState<string>(searchParams.get('key') ?? '')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initColumnFilters)
  const [sorting, setSorting] = useState<SortingState>(initSorting)
  const [pagination, setPagination] = useState<PaginationState>(initPagination)

  // ✅ Construct OData query parameters (following guideline #1: derive data during render)
  const getODataQueryParams = useCallback((): ODataQueryOptions => {
    const params: ODataQueryOptions = {
      $count: true,
      $top: pagination.pageSize,
      $skip: pagination.pageIndex * pagination.pageSize,
    }

    // Apply sorting
    if (sorting.length > 0) {
      params.$orderby = `${sorting[0].id} ${sorting[0].desc ? 'desc' : 'asc'}`
    }

    // Apply filtering
    const filters: string[] = []

    // Key filter
    const keyFilter = columnFilters.find((filter) => filter.id === 'key')
    if (keyFilter?.value) {
      filters.push(`contains(tolower(key), '${(keyFilter.value as string).toLowerCase()}')`)
    }

    // Type filter
    const typeFilter = columnFilters.find((filter) => filter.id === 'type')
    const typeValue = typeFilter?.value as string

    if (typeValue) {
      // Handle filter mapping - convert UI filter values to API expected values
      if (typeValue === '0' || typeValue === 'String') {
        filters.push(`type eq 'String'`)
      } else if (typeValue === '1' || typeValue === 'Secret') {
        filters.push(`type eq 'Secret'`)
      }
    }

    if (filters.length > 0) {
      params.$filter = filters.join(' and ')
    }

    return params
  }, [pagination, sorting, columnFilters])

  // ✅ SWR for assets data - following guideline #8: use framework-level loaders
  const queryParams = getODataQueryParams()
  const {
    data: assetsResponse,
    error: assetsError,
    isLoading,
    mutate: mutateAssets,
  } = useSWR(swrKeys.assetsWithOData(queryParams as Record<string, unknown>), () =>
    getAssetsWithOData(queryParams),
  )

  // ✅ Transform data during render (following guideline #1: prefer deriving data during render)
  const assets = useMemo(() => {
    if (!assetsResponse?.value) return []
    return assetsResponse.value.map((asset: AssetRow) => ({
      id: asset.id,
      key: asset.key,
      type: asset.type, // Keep the original type value from API (can be string or number)
      description: asset.description,
      createdBy: asset.createdBy,
    }))
  }, [assetsResponse])

  // Calculate page count based on total count
  const pageCount = useMemo(() => {
    const calculatedCount = getCalculatedPageCount(totalCount, pagination.pageSize)
    const hasMorePages =
      assets.length === pagination.pageSize &&
      totalCount <= pagination.pageSize * (pagination.pageIndex + 1)
    const minValidPageCount = getMinimumValidPageCount(pagination.pageIndex)
    if (hasMorePages) {
      return Math.max(minValidPageCount, calculatedCount, pagination.pageIndex + 2)
    }
    return Math.max(minValidPageCount, calculatedCount)
  }, [pagination.pageSize, pagination.pageIndex, assets.length, totalCount])

  const isUnknownTotalCount = useMemo(() => {
    return !hasExactCount && assets.length === pagination.pageSize
  }, [hasExactCount, assets.length, pagination.pageSize])

  // ✅ Handle SWR errors (following guideline #3: error handling in dedicated effects)
  // Client-only: Requires toast notifications for user feedback
  useEffect(() => {
    if (assetsError) {
      console.error('Failed to load assets:', assetsError)
      toast({
        title: 'Error',
        description: 'Failed to load assets. Please try again.',
        variant: 'destructive',
      })
    }
  }, [assetsError, toast])

  // ✅ Update total count when data changes (following guideline #1: derive data during render)
  // Client-only: Requires state updates for pagination
  useEffect(() => {
    if (!assetsResponse) return

    const response = assetsResponse

    // Handle exact count from OData
    if (typeof response['@odata.count'] === 'number') {
      setTotalCount(response['@odata.count'])
      totalCountRef.current = response['@odata.count']
      setHasExactCount(true)
      return
    }

    if (!Array.isArray(response.value)) return

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
      setTotalCount(minCount + 1)
      totalCountRef.current = minCount + 1
    }

    setHasExactCount(false)
  }, [assetsResponse, pagination.pageIndex, pagination.pageSize])

  const [selectedAsset, setSelectedAsset] = useState<AssetEditRow | null>(null)

  const handleEditAsset = useCallback(
    async (asset: AssetRow) => {
      try {
        const assetDetail = await getAssetDetail(asset.id)
        const assetAgents = await getAssetAgents(asset.id)
        const formattedAgents = assetAgents.map((agent) => ({
          id: agent.id,
          name: agent.name,
        }))

        // Convert type to number for editing modal consistency
        let typeAsNumber: number
        if (asset.type === 'String' || asset.type === 0 || asset.type === '0') {
          typeAsNumber = 0
        } else {
          typeAsNumber = 1
        }

        const updatedAsset = {
          ...asset,
          type: typeAsNumber,
          value: assetDetail.value ?? '',
          agents: formattedAgents.length > 0 ? formattedAgents : [],
        }
        setSelectedAsset(updatedAsset)
        setModalMode('edit')
        setIsModalOpen(true)
      } catch (error) {
        console.error('Error preparing asset for edit:', error)
        toast({
          title: 'Error',
          description: 'Failed to load asset details for editing.',
          variant: 'destructive',
        })
      }
    },
    [toast],
  )

  // ✅ Handle empty page edge case (following guideline #1: derive data during render)
  useEffect(() => {
    if (assetsResponse?.value) {
      const isEmptyPageBeyondFirst =
        assetsResponse.value.length === 0 && totalCountRef.current > 0 && pagination.pageIndex > 0
      if (isEmptyPageBeyondFirst) {
        const calculatedPageCount = Math.max(
          1,
          Math.ceil(totalCountRef.current / pagination.pageSize),
        )
        if (pagination.pageIndex >= calculatedPageCount) {
          setPagination((prev: PaginationState) => ({ ...prev, pageIndex: 0 }))
          updateUrl(pathname, { page: '1' })
        }
      }
    }
  }, [
    assetsResponse,
    pagination.pageIndex,
    pagination.pageSize,
    totalCountRef,
    updateUrl,
    pathname,
  ])

  // ✅ Refresh handler using SWR mutate (following guideline #8: use framework-level loaders)
  const refreshAssets = useCallback(async () => {
    setIsPending(false)
    setIsChangingPageSize(false)
    await mutateAssets()
  }, [mutateAssets])

  const tableColumns = useMemo(
    () => createColumns(handleEditAsset, refreshAssets, t),
    [handleEditAsset, refreshAssets, t],
  )

  // Setup table instance
  const table = useReactTable({
    data: assets,
    columns: tableColumns,
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
  })

  function updateKeyFilter(prev: ColumnFiltersState, value: string): ColumnFiltersState {
    const newFilters = prev.filter((filter: ColumnFilter) => filter.id !== 'key')
    if (value) {
      newFilters.push({ id: 'key', value })
    }
    return newFilters
  }

  // Handle search input changes
  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      setIsPending(true)
      if (searchDebounceTimeout.current) clearTimeout(searchDebounceTimeout.current)
      searchDebounceTimeout.current = setTimeout(() => {
        setColumnFilters((prev: ColumnFiltersState) => updateKeyFilter(prev, value))
        // Always reset page to 1 when filter changes
        updateUrl(pathname, { key: value ?? null, page: '1' })
        setPagination((prev: PaginationState) => ({ ...prev, pageIndex: 0 }))
        setIsPending(false)
      }, 500)
    },
    [updateUrl, pathname],
  )

  // Calculate current type filter value for UI display
  const currentTypeFilterValue = useMemo(() => {
    const typeFilter = columnFilters.find((filter) => filter.id === 'type')
    return typeFilter ? (typeFilter.value as string) : 'all'
  }, [columnFilters])

  // Handle type filter changes
  const handleTypeFilterChange = useCallback(
    (value: string) => {
      if (value === 'all') {
        setColumnFilters((prev: ColumnFiltersState) =>
          prev.filter((filter: ColumnFilter) => filter.id !== 'type'),
        )
      } else {
        setColumnFilters((prev: ColumnFiltersState) => {
          const newFilters = prev.filter((filter: ColumnFilter) => filter.id !== 'type')
          newFilters.push({ id: 'type', value })
          return newFilters
        })
      }
      // Always reset page to 1 when filter changes
      updateUrl(pathname, {
        type: value === 'all' ? null : value,
        page: '1',
      })
      setPagination((prev: PaginationState) => ({ ...prev, pageIndex: 0 }))
    },
    [updateUrl, pathname],
  )

  // ✅ Simple handlers using SWR mutate (following guideline #8: use framework-level loaders)
  const handleAssetCreated = () => mutateAssets()

  const handleRowClick = (row: AssetRow) => {
    const isAdmin = pathname.startsWith('/admin')
    const tenant = pathname.split('/')[1]
    const route = isAdmin ? `/admin/asset/${row.id}` : `/${tenant}/asset/${row.id}`
    router.push(route)
  }

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">{t('asset.title')}</h2>
          <div className="flex items-center space-x-2">
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

        {assetsError && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300">{t('asset.loadError')}</p>
            <Button variant="outline" className="mt-2" onClick={() => mutateAssets()}>
              {t('asset.retry')}
            </Button>
          </div>
        )}

        <DataTableToolbar
          table={table}
          types={[
            { value: '0', label: t('asset.types.string') },
            { value: '1', label: t('asset.types.secret') },
          ]}
          onSearch={handleSearch}
          onTypeChange={handleTypeFilterChange}
          searchValue={searchValue}
          typeFilterValue={currentTypeFilterValue}
          isFiltering={isLoading}
          isPending={isPending}
        />

        <DataTable
          data={assets ?? []}
          columns={tableColumns}
          onRowClick={(row) => {
            if (isModalOpen) return
            handleRowClick(row)
          }}
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
          rowsLabel={t('asset.rowsLabel')}
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
          }}
        />
      </div>

      <CreateEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAsset(null)
        }}
        mode={modalMode}
        onCreated={handleAssetCreated}
        existingKeys={assets.map((item: AssetRow) => item.key)}
        asset={selectedAsset}
      />
    </>
  )
}
