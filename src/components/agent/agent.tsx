'use client'

import { PlusCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createAgentColumns } from './columns'
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
import {
  getBotAgentsWithOData,
  getBotAgentById,
  type ODataQueryOptions,
  BotAgentResponseDto,
} from '@/lib/api/bot-agents'
import { useUrlParams } from '@/hooks/use-url-params'
import { Pagination } from '@/components/ui/pagination'
import { useAgentStatus } from '@/hooks/use-agent-status'
import useSWR from 'swr'
import { swrKeys } from '@/lib/config/swr-config'
import { useToast } from '@/components/ui/use-toast'

export const agentSchema = z.object({
  id: z.string(),
  botAgentId: z.string(),
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
  const { toast } = useToast()

  // UI State management
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingAgent, setEditingAgent] = useState<BotAgentResponseDto | null>(null)
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
  const [searchValue, setSearchValue] = useState<string>(searchParams.get('name') ?? '')

  // Extract tenant from pathname (e.g., /tenant/agent)
  const tenant = pathname.split('/')[1]

  // ✅ Convert table state to OData query parameters (following guideline #1: derive data during render)
  const queryParams = useMemo((): ODataQueryOptions => {
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

  // ✅ SWR for agents data - following guideline #8: use framework-level loaders
  const {
    data: agentsResponse,
    error: agentsError,
    isLoading,
    mutate: mutateAgents,
  } = useSWR(swrKeys.agentsWithOData(queryParams as Record<string, unknown>), () =>
    getBotAgentsWithOData(queryParams),
  )

  // ✅ Transform data during render (following guideline #1: prefer deriving data during render)
  const agents = useMemo(() => {
    if (!agentsResponse?.value) return []
    return agentsResponse.value.map((agent: BotAgentResponseDto) => ({
      ...agent,
      botAgentId: agent.id, // Ensure botAgentId is present for real-time merge
    }))
  }, [agentsResponse])

  // ✅ Handle SWR errors (following guideline #3: error handling in dedicated effects)
  // Client-only: Requires toast notifications for user feedback
  useEffect(() => {
    if (agentsError) {
      console.error('Failed to load agents:', agentsError)
      toast({
        title: 'Error',
        description: 'Failed to load agents. Please try again.',
        variant: 'destructive',
      })
    }
  }, [agentsError, toast])

  // ✅ Update total count when data changes (following guideline #1: derive data during render)
  // Client-only: Requires state updates for pagination
  useEffect(() => {
    if (!agentsResponse) return

    const response = agentsResponse

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
  }, [agentsResponse, pagination.pageIndex, pagination.pageSize])

  // ✅ Handle empty page edge case (following guideline #1: derive data during render)
  useEffect(() => {
    if (agentsResponse?.value) {
      const isEmptyPageBeyondFirst =
        agentsResponse.value.length === 0 && totalCountRef.current > 0 && pagination.pageIndex > 0

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
    agentsResponse,
    pagination.pageIndex,
    pagination.pageSize,
    totalCountRef,
    updateUrl,
    pathname,
  ])

  // ✅ Refresh handler using SWR mutate (following guideline #8: use framework-level loaders)
  const refreshAgents = useCallback(async () => {
    setIsPending(false)
    setIsChangingPageSize(false)
    await mutateAgents()
  }, [mutateAgents])

  // Use real-time status only, no refetch on status update
  const agentStatuses = useAgentStatus(tenant)

  // Intercept console errors for SignalR
  useEffect(() => {
    const originalConsoleError = console.error
    console.error = (...args) => {
      // Filter out SignalR-related errors
      if (
        args.length > 0 &&
        typeof args[0] === 'string' &&
        (args[0].includes('SignalR') ||
          args[0].includes('connection') ||
          args[0].includes('Connection') ||
          args[0].includes('Failed to start'))
      ) {
        console.debug('[Suppressed]', ...args)
        return
      }
      originalConsoleError(...args)
    }

    return () => {
      console.error = originalConsoleError
    }
  }, [])

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
      agents.length === pagination.pageSize &&
      totalCount <= pagination.pageSize * (pagination.pageIndex + 1)

    // Calculate the minimum valid page count
    const minValidPageCount = getMinimumValidPageCount(pagination.pageIndex)

    // Determine final page count
    if (hasMorePages) {
      return Math.max(minValidPageCount, calculatedCount, pagination.pageIndex + 2)
    }

    return Math.max(minValidPageCount, calculatedCount)
  }, [pagination.pageSize, pagination.pageIndex, agents.length, totalCount])

  // When rendering the DataTable, inject real-time status if available
  const agentsWithRealtimeStatus = useMemo(() => {
    return agents.map((agent) => {
      const realTime = agentStatuses[agent.botAgentId]
      if (realTime) {
        // Use debug level logging to avoid console noise
        console.debug('Merging real-time status for', agent.botAgentId, realTime.status)
      }
      return realTime ? { ...agent, status: realTime.status } : agent
    })
  }, [agents, agentStatuses])

  // Helper to check if the count is a reliable total or just a minimum
  const isUnknownTotalCount = useMemo(() => {
    return !hasExactCount && agents.length === pagination.pageSize
  }, [hasExactCount, agents.length, pagination.pageSize])

  // ✅ Edit handler
  const handleEditAgent = async (agentRow: AgentRow) => {
    try {
      // Fetch full agent details for editing
      const agentDetail = await getBotAgentById(agentRow.id)
      setEditingAgent(agentDetail)
      setModalMode('edit')
      setIsModalOpen(true)
    } catch (error) {
      console.error('Failed to fetch agent details:', error)
      toast({
        title: 'Error',
        description: 'Failed to load agent details for editing.',
        variant: 'destructive',
      })
    }
  }

  // Setup table instance with real-time data and custom row ID
  const table = useReactTable({
    data: agentsWithRealtimeStatus,
    columns: createAgentColumns(refreshAgents, handleEditAgent),
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
    getRowId: (row) => row.botAgentId, // Use botAgentId as the row ID for best real-time UX
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
    }
  }, [])

  // ✅ Simple handlers using SWR mutate (following guideline #8: use framework-level loaders)
  const handleAgentCreated = () => mutateAgents()

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingAgent(null)
  }

  const handleRowClick = (row: AgentRow) => {
    const isAdmin = pathname.startsWith('/admin')
    const route = isAdmin ? `/admin/agent/${row.id}` : `/${tenant}/agent/${row.id}`
    router.push(route)
  }

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Agents</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                window.location.href =
                  'https://openautomate-agent.s3.ap-southeast-1.amazonaws.com/OpenAutomate.BotAgent.Installer.msi'
              }}
              className="flex items-center justify-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Agent
            </Button>
            <Button
              onClick={() => {
                setEditingAgent(null)
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

        {agentsError && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300">
              Failed to load agents. Please try again.
            </p>
            <Button variant="outline" className="mt-2" onClick={() => mutateAgents()}>
              Retry
            </Button>
          </div>
        )}

        <DataTableToolbar
          table={table}
          statuses={[
            { value: 'Available', label: 'Available' },
            { value: 'Busy', label: 'Busy' },
            { value: 'Disconnected', label: 'Disconnected' },
          ]}
          onSearch={handleSearch}
          onStatusChange={handleStatusFilterChange}
          searchValue={searchValue}
          isFiltering={isLoading}
          isPending={isPending}
        />

        <DataTable
          data={agentsWithRealtimeStatus}
          columns={createAgentColumns(refreshAgents, handleEditAgent)}
          table={table}
          onRowClick={handleRowClick}
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

      {/* ✅ Dynamic key resets modal state */}
      <CreateEditModal
        key={editingAgent?.id ?? 'new'}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        mode={modalMode}
        agent={editingAgent}
        onSuccess={handleAgentCreated}
      />
    </>
  )
}
