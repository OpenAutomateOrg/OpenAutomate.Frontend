'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns } from './columns'
import { DataTable } from '@/components/layout/table/data-table'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { CreateEditModal } from '@/components/agent/create-edit-modal'
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
} from '@tanstack/react-table'
import { getBotAgentsWithOData, type ODataQueryOptions } from '@/lib/api/bot-agents'
import { useUrlParams } from '@/hooks/use-url-params'
import { Pagination } from '@/components/ui/pagination'

export const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  machineName: z.string(),
  status: z.string(),
  lastConnected: z.string(),
})

export type AgentRow = z.infer<typeof agentSchema>

export default function AgentInterface() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { updateUrl } = useUrlParams()

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  // Table state
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const totalCountRef = useRef<number>(0)

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isChangingPageSize, setIsChangingPageSize] = useState(false)

  // Create refs for debouncing
  const searchDebounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const fetchTimeout = useRef<NodeJS.Timeout | null>(null)
  const shouldInitializeUrl = useRef(true)

  // Initialize state from URL params
  const initColumnFilters = (): ColumnFiltersState => {
    const filters: ColumnFiltersState = []

    const nameFilter = searchParams.get('name')
    if (nameFilter) filters.push({ id: 'name', value: nameFilter })

    const statusFilter = searchParams.get('status')
    if (statusFilter) filters.push({ id: 'status', value: statusFilter })

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
  const [searchValue, setSearchValue] = useState<string>(searchParams.get('name') || '')

  // Initialize URL with default params if needed
  useEffect(() => {
    if (shouldInitializeUrl.current) {
      shouldInitializeUrl.current = false

      const page = searchParams.get('page')
      const size = searchParams.get('size')

      if (!page || !size) {
        updateUrl(pathname, {
          page: page || '1',
          size: size || '10',
        })
      }
    }
  }, [searchParams, updateUrl, pathname])

  // Convert table state to OData query parameters
  const getODataQueryParams = useCallback((): ODataQueryOptions => {
    const params: ODataQueryOptions = {
      $top: pagination.pageSize,
      $skip: pagination.pageIndex * pagination.pageSize,
      $count: true,
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
              return `(contains(tolower(name), '${value.toLowerCase()}') or contains(tolower(machineName), '${value.toLowerCase()}'))`
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

  // Calculate page count
  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(totalCountRef.current / pagination.pageSize))
  }, [pagination.pageSize])

  // Setup table instance
  const table = useReactTable({
    data: agents,
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
      const statusColumn = table.getColumn('status')

      if (statusColumn) {
        const filterValue = value === 'all' ? '' : value
        statusColumn.setFilterValue(filterValue)

        updateUrl(pathname, {
          status: filterValue || null,
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
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current)
    }
  }, [])

  // Fetch data with proper handling
  const fetchAgents = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const queryParams = getODataQueryParams()
      const response = await getBotAgentsWithOData(queryParams)

      // Update total count if available
      if (typeof response['@odata.count'] === 'number') {
        setTotalCount(response['@odata.count'])
        totalCountRef.current = response['@odata.count']
      } else if (pagination.pageIndex === 0 && Array.isArray(response.value)) {
        setTotalCount(response.value.length)
        totalCountRef.current = response.value.length
      }

      // Process agent data
      if (Array.isArray(response.value)) {
        const formattedAgents = response.value.map((agent) => ({
          id: agent.id,
          name: agent.name,
          machineName: agent.machineName,
          status: agent.status,
          lastConnected: agent.lastConnected,
        }))

        setAgents(formattedAgents || [])

        // Handle empty page edge case
        if (response.value.length === 0 && totalCountRef.current > 0 && pagination.pageIndex > 0) {
          const calculatedPageCount = Math.max(
            1,
            Math.ceil(totalCountRef.current / pagination.pageSize),
          )

          if (pagination.pageIndex >= calculatedPageCount) {
            setPagination((prev) => ({
              ...prev,
              pageIndex: 0,
            }))
            updateUrl(pathname, { page: '1' })
          }
        }
      } else {
        setAgents([])
      }
    } catch (_err) {
      setError('Failed to load agents. Please try again. - ' + _err)
    } finally {
      setIsLoading(false)
      setIsPending(false)
      setIsChangingPageSize(false)
    }
  }, [getODataQueryParams, pagination.pageIndex, pagination.pageSize, updateUrl, pathname])

  // Fetch data when pagination changes
  useEffect(() => {
    if (fetchTimeout.current) clearTimeout(fetchTimeout.current)

    fetchTimeout.current = setTimeout(() => {
      fetchAgents()
    }, 100) // Small delay to batch state changes

    return () => {
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current)
    }
  }, [fetchAgents, pagination])

  // Simple handlers
  const handleAgentCreated = () => fetchAgents()

  const handleRowClick = (row: AgentRow) => {
    const isAdmin = pathname.startsWith('/admin')
    const tenant = pathname.split('/')[1]
    const route = isAdmin ? `/admin/agent/${row.id}` : `/${tenant}/agent/${row.id}`
    router.push(route)
  }

  // Initial data fetch
  useEffect(() => {
    fetchAgents()
  }, [fetchAgents, pagination])

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Agents</h2>
          <div className="flex items-center space-x-2">
            {totalCount > 0 && (
              <div className="text-sm text-muted-foreground">
                <span>
                  Total: {totalCount} agent{totalCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
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

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300">{error}</p>
            <Button variant="outline" className="mt-2" onClick={fetchAgents}>
              Retry
            </Button>
          </div>
        )}

        <DataTableToolbar
          table={table}
          statuses={[
            { value: 'Connected', label: 'Connected' },
            { value: 'Disconnected', label: 'Disconnected' },
            { value: 'Offline', label: 'Offline' },
          ]}
          onSearch={handleSearch}
          onStatusChange={handleStatusFilterChange}
          searchValue={searchValue}
          isFiltering={isLoading}
          isPending={isPending}
        />

        <DataTable
          data={agents || []}
          columns={columns}
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

        {!isLoading && agents.length === 0 && !error && (
          <div className="text-center py-10 text-muted-foreground">
            <p>No agents found. Create your first agent to get started.</p>
          </div>
        )}
      </div>

      <CreateEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        onSuccess={handleAgentCreated}
      />
    </>
  )
}
