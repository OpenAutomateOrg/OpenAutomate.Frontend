'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateColumns as createHistoricalColumns } from './historical/columns'
import { createInProgressColumns } from './inProgress/columns'
import { DataTable } from '@/components/layout/table/data-table'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import CreateExecutionModal from './create-execution-modal'

import { z } from 'zod'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { DataTableToolbar as HistoricalToolbar } from './historical/data-table-toolbar'
import { DataTableToolbar as ProgressToolbar } from './inProgress/data-table-toolbar'
import { useToast } from '@/components/ui/use-toast'
import {
  getExecutionsWithOData,
  getAllExecutions,
  ExecutionResponseDto,
  ODataQueryOptions,
} from '@/lib/api/executions'
import useSWR from 'swr'
import { swrKeys } from '@/lib/config/swr-config'
import { useUrlParams } from '@/hooks/use-url-params'
import { Pagination } from '@/components/ui/pagination'
import { useExecutionStatus } from '@/hooks/use-execution-status'
import { formatUtcToLocal } from '@/lib/utils/datetime'
import { useLocale } from '@/providers/locale-provider'

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

export const executionsSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  value: z.string(),
  createdBy: z.string(),
  label: z.string(),
  status: z.string(),
  Version: z.string().optional(),
  Agent: z.string().optional(),
  State: z.string().optional(),
  'Start Time': z.string().optional(),
  'End Time': z.string().optional(),
  Source: z.string().optional(),
  Command: z.string().optional(),
  Schedules: z.string().optional(),
  'Task Id': z.string().optional(),
  'Created Date': z.string().optional(),
  'Created By': z.string().optional(),
  agent: z.string().optional(),
  state: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  source: z.string().optional(),
  command: z.string().optional(),
  schedules: z.string().optional(),
  taskId: z.string().optional(),
  createdDate: z.string().optional(),
  packageName: z.string().optional(),
  hasLogs: z.boolean().optional(),
})

export type ExecutionsRow = z.infer<typeof executionsSchema>

export default function ExecutionsInterface() {
  const { t } = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { updateUrl } = useUrlParams()
  const { toast } = useToast()

  // UI State management
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [tab, setTab] = useState<'inprogress' | 'historical'>('inprogress')
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
    // Temporarily disable ALL column filters for In Progress tab to test
    if (tab === 'inprogress') {
      console.log('🔍 Disabling ALL column filters for In Progress tab (debugging)')
      return []
    }

    const filters: ColumnFiltersState = []

    const searchFilter = searchParams.get('search')
    if (searchFilter) {
      filters.push({ id: 'packageName', value: searchFilter })
    }

    // Apply status filter for other tabs
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      filters.push({ id: 'state', value: statusFilter })
    }

    return filters
  }

  const initSorting = (): SortingState => {
    const sort = searchParams.get('sort')
    const order = searchParams.get('order')

    if (sort && (order === 'asc' || order === 'desc')) {
      return [{ id: sort, desc: order === 'desc' }]
    }

    // Default sorting for Historical tab: newest executions first
    if (tab === 'historical') {
      return [{ id: 'startTime', desc: true }]
    }

    return []
  }

  const initPagination = (): PaginationState => {
    const page = searchParams.get('page')
    const size = searchParams.get('size')

    // Always enforce a valid page size, defaulting to 10
    const pageSize = size ? Math.max(1, parseInt(size)) : 10

    console.log(
      `Initializing pagination from URL: page=${page}, size=${size}, pageSize=${pageSize}`,
    )

    return {
      pageIndex: page ? Math.max(0, parseInt(page) - 1) : 0,
      pageSize: pageSize,
    }
  }

  // State from URL
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initColumnFilters)
  const [sorting, setSorting] = useState<SortingState>(initSorting)
  const [pagination, setPagination] = useState<PaginationState>(initPagination)

  // UI state for search input
  const [searchValue, setSearchValue] = useState<string>(searchParams.get('search') ?? '')

  // Extract tenant from pathname (e.g., /tenant/executions)
  const tenant = pathname.split('/')[1]

  // ✅ Real-time execution status updates via SignalR
  const executionStatuses = useExecutionStatus(tenant)

  // ✅ SignalR error handling (following React guide compliance)
  // Client-only: Better error handling without global console override
  useEffect(() => {
    // Instead of globally suppressing console.error, we handle SignalR errors
    // through the SignalR connection's error handling mechanisms
    // This avoids the dangerous practice of global console override

    // Note: SignalR errors should be handled in the useExecutionStatus hook
    // or through proper error boundaries, not by suppressing console.error
    console.debug(
      '[Executions] Component mounted - SignalR error handling delegated to connection hooks',
    )

    // No cleanup needed since we're not modifying global state
  }, [])

  // Convert table state to OData query parameters
  const getODataQueryParams = useCallback((): ODataQueryOptions => {
    const params: ODataQueryOptions = {
      $top: pagination.pageSize,
      $skip: pagination.pageIndex * pagination.pageSize,
      $count: true,
    }

    // Add sorting with column mapping
    if (sorting.length > 0) {
      params.$orderby = sorting
        .map((sort) => {
          // Map frontend column names to backend property names
          let backendColumn = sort.id
          if (sort.id === 'startTime') {
            backendColumn = 'StartTime'
          } else if (sort.id === 'endTime') {
            backendColumn = 'EndTime'
          } else if (sort.id === 'agent') {
            backendColumn = 'BotAgentName'
          } else if (sort.id === 'state') {
            backendColumn = 'Status'
          }

          console.log(`🔄 Sorting: ${sort.id} → ${backendColumn} ${sort.desc ? 'desc' : 'asc'}`)
          return `${backendColumn} ${sort.desc ? 'desc' : 'asc'}`
        })
        .join(',')

      console.log(`📊 Final OData $orderby: ${params.$orderby}`)
    }

    // Add filtering
    if (columnFilters.length > 0) {
      const filters = columnFilters
        .filter((filter) => !(typeof filter.value === 'string' && filter.value === ''))
        .map((filter) => {
          const column = filter.id
          const value = filter.value

          if (typeof value === 'string') {
            // Search by Agent only
            if (column === 'agent' && value) {
              return `contains(tolower(botAgentName), '${value.toLowerCase()}')`
            }
            if (column === 'packageName' && value) {
              return `contains(tolower(botAgentName), '${value.toLowerCase()}')`
            }
            if (column === 'state' && value) {
              return `Status eq '${value}'`
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

    // Add tab-specific filtering
    let tabFilter = ''
    switch (tab) {
      case 'inprogress':
        tabFilter = "Status eq 'Queued' or Status eq 'Starting' or Status eq 'Running'"
        break
      case 'historical':
        tabFilter = "Status eq 'Completed' or Status eq 'Failed' or Status eq 'Cancelled'"
        break
    }

    if (tabFilter) {
      params.$filter = params.$filter ? `(${params.$filter}) and (${tabFilter})` : tabFilter
    }

    return params
  }, [pagination, sorting, columnFilters, tab])

  // SWR for executions data with OData query
  const queryParams = getODataQueryParams()
  const swrKey = useMemo(
    () => swrKeys.executionsWithOData(queryParams as Record<string, unknown>),
    [queryParams],
  )

  const {
    data: executionsResponse,
    error: executionsError,
    isLoading,
    mutate: mutateExecutions,
  } = useSWR(swrKey, () => getExecutionsWithOData(queryParams), {
    dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
    revalidateOnFocus: false, // Disable aggressive revalidation
    revalidateIfStale: true, // Only revalidate if data is actually stale
    keepPreviousData: true, // Keep previous data while fetching new data for better UX
    refreshInterval: tab === 'inprogress' ? 30000 : 0, // Refresh every 30 seconds for In Progress tab (much less aggressive)
  })

  // Fallback to regular executions API if OData fails or returns empty data
  const { data: fallbackExecutions } = useSWR(
    executionsResponse?.value?.length === 0 || executionsError ? swrKeys.executions() : null,
    getAllExecutions,
  )

  // Debug logging for data sources (only when there are issues)
  if (executionsError || (executionsResponse?.value?.length === 0 && fallbackExecutions)) {
    console.log('📊 Data source debug:', {
      hasODataResponse: !!executionsResponse?.value,
      oDataCount: executionsResponse?.value?.length || 0,
      hasFallback: !!fallbackExecutions,
      fallbackCount: fallbackExecutions?.length || 0,
      hasError: !!executionsError,
    })
  }

  // Combined loading state
  const isDataLoading = isLoading || (executionsError && !fallbackExecutions)

  // Define transformation function before using it in useMemo
  const transformExecutionToRow = useCallback(
    (execution: ExecutionResponseDto): ExecutionsRow => {
      // Check for real-time status update for this execution
      const realtimeUpdate = executionStatuses[execution.id]
      const currentStatus = realtimeUpdate?.status || execution.status

      // Helper function to safely format dates using our datetime utility
      const formatDate = (dateString: string | undefined | null): string => {
        return formatUtcToLocal(dateString, { fallback: '' })
      }

      const formattedStartTime = formatDate(execution.startTime)
      const formattedEndTime = formatDate(execution.endTime)

      // Debug logging for date transformation (simplified)
      if (!execution.startTime) {
        console.warn('🕒 Missing startTime for execution:', execution.id)
      }

      return {
        id: execution.id,
        Version: execution.packageVersion || '',
        Agent: execution.botAgentName || '',
        State: currentStatus,
        'Start Time': formattedStartTime,
        'End Time': formattedEndTime,
        Source: execution.source || 'Manual',
        Command: 'execute',
        Schedules: execution.source === 'Scheduled' ? (execution.scheduleName || 'Scheduled') : 'Once',
        'Task Id': execution.id,
        'Created Date': formatUtcToLocal(execution.startTime, {
          dateStyle: 'medium',
          timeStyle: undefined,
          fallback: '',
        }),
        'Created By': 'Current User', // Get from auth context when available

        // Legacy fields for compatibility - KEEP RAW DATA for column access
        name: execution.packageName || '',
        type: 'execution',
        value: execution.packageVersion || '',
        createdBy: 'Current User',
        label: execution.botAgentName || '',
        status: currentStatus,
        agent: execution.botAgentName || '',
        state: currentStatus,
        startTime: execution.startTime, // Keep RAW data here for column formatting
        endTime: execution.endTime, // Keep RAW data here for column formatting
        source: execution.source || 'Manual',
        command: 'execute',
        schedules: execution.source === 'Scheduled' ? (execution.scheduleName || 'Scheduled') : 'Once',
        taskId: execution.id,
        createdDate: formatUtcToLocal(execution.startTime, {
          dateStyle: 'medium',
          timeStyle: undefined,
          fallback: '',
        }),
        packageName: execution.packageName || '',
        hasLogs: execution.hasLogs || false,
      }
    },
    [executionStatuses],
  )

  // ✅ Create columns with proper handlers

  const ProgressColumns = useMemo(
    () =>
      createInProgressColumns({
        onDeleted: () => {
          void mutateExecutions()
        },
      }),
    [mutateExecutions],
  )

  const HistoricalColumns = useMemo(
    () =>
      createHistoricalColumns({
        onDeleted: () => {
          void mutateExecutions()
        },
      }),
    [mutateExecutions],
  )

  // ✅ SWR automatically refetches when queryParams change, no manual reload needed
  // Removed problematic useEffect hooks that caused infinite loops

  // Helper function to filter data by tab
  const filterByTab = useCallback((data: ExecutionsRow[], currentTab: string) => {
    return data.filter((row) => {
      if (currentTab === 'inprogress') {
        return row.state === 'Running' || row.state === 'Pending'
      } else if (currentTab === 'historical') {
        return row.state === 'Completed' || row.state === 'Failed' || row.state === 'Cancelled'
      }
      return true
    })
  }, [])

  // Helper function to apply sorting
  const applySorting = useCallback((data: ExecutionsRow[], sortConfig: SortingState) => {
    if (sortConfig.length === 0) return data

    return [...data].sort((a, b) => {
      const sort = sortConfig[0]
      const aValue = a[sort.id as keyof ExecutionsRow]
      const bValue = b[sort.id as keyof ExecutionsRow]

      // Handle date sorting
      if (sort.id === 'startTime' || sort.id === 'endTime') {
        const dateA = new Date(aValue as string)
        const dateB = new Date(bValue as string)

        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0
        if (isNaN(dateA.getTime())) return 1
        if (isNaN(dateB.getTime())) return -1

        const result = dateA.getTime() - dateB.getTime()
        return sort.desc ? -result : result
      }

      // Handle string sorting
      const result = String(aValue).localeCompare(String(bValue))
      return sort.desc ? -result : result
    })
  }, [])

  // Helper function to apply search and state filters
  const applyFilters = useCallback(
    (data: ExecutionsRow[], search: string, filters: ColumnFiltersState) => {
      let filtered = data

      // Apply search filtering
      if (search) {
        filtered = filtered.filter((row) => row.agent?.toLowerCase().includes(search.toLowerCase()))
      }

      // Apply state filter
      const stateFilter = filters.find((filter) => filter.id === 'state')?.value as string
      if (stateFilter) {
        filtered = filtered.filter((row) => row.state === stateFilter)
      }

      return filtered
    },
    [],
  )

  // Helper function to process fallback data
  const processFallbackData = useCallback(() => {
    if (tab === 'inprogress') {
      console.log(
        '⚠️ Using fallback data for In Progress tab - OData filtering may not work correctly',
      )
    }

    const transformedData = fallbackExecutions!.map(transformExecutionToRow)
    let filteredData = filterByTab(transformedData, tab)
    filteredData = applySorting(filteredData, sorting)
    filteredData = applyFilters(filteredData, searchValue, columnFilters)

    const filteredLength = filteredData.length
    const start = pagination.pageIndex * pagination.pageSize
    const end = start + pagination.pageSize
    const paginatedData = filteredData.slice(start, end)

    // Update total count
    if (totalCount !== filteredLength) {
      setTimeout(() => {
        setTotalCount(filteredLength)
        totalCountRef.current = filteredLength
      }, 0)
    }

    return paginatedData
  }, [
    fallbackExecutions,
    transformExecutionToRow,
    tab,
    filterByTab,
    applySorting,
    sorting,
    applyFilters,
    searchValue,
    columnFilters,
    pagination,
    totalCount,
  ])

  // Transform data during render
  const executions = useMemo(() => {
    // Use fallback data if OData response is empty
    const shouldUseFallback =
      fallbackExecutions && (!executionsResponse?.value || executionsResponse.value.length === 0)

    if (shouldUseFallback) {
      return processFallbackData()
    }

    // Otherwise use OData response
    if (!executionsResponse?.value) {
      console.log('No data available from OData or fallback')
      return []
    }

    const transformedRows = executionsResponse.value.map(transformExecutionToRow)

    console.log(
      `✅ OData returned ${executionsResponse.value.length} executions, transformed to ${transformedRows.length} rows`,
    )
    console.log(
      '📋 Execution statuses from OData:',
      executionsResponse.value.map((e) => ({
        id: e.id.substring(0, 8),
        status: e.status,
      })),
    )
    console.log(
      '📋 Transformed row states:',
      transformedRows.map((r) => ({
        id: r.id.substring(0, 8),
        State: r.State,
      })),
    )

    return transformedRows
  }, [executionsResponse, fallbackExecutions, transformExecutionToRow, processFallbackData])

  // Update totalCount from filteredData in a separate useEffect
  useEffect(() => {
    const shouldUseFallback =
      fallbackExecutions && (!executionsResponse?.value || executionsResponse.value.length === 0)

    if (shouldUseFallback) {
      // Calculate filtered length using helper functions
      const transformedData = fallbackExecutions!.map(transformExecutionToRow)
      let filteredData = filterByTab(transformedData, tab)
      filteredData = applyFilters(filteredData, searchValue, columnFilters)

      // Update total count if different
      if (totalCount !== filteredData.length) {
        setTotalCount(filteredData.length)
        totalCountRef.current = filteredData.length
      }
    }
  }, [
    fallbackExecutions,
    executionsResponse,
    transformExecutionToRow,
    filterByTab,
    tab,
    applyFilters,
    searchValue,
    columnFilters,
    totalCount,
  ])

  // Extract actual data array from the executions object
  const executionsData = useMemo(() => executions, [executions])

  // ✅ Update total count when data changes (following guideline #1: derive data during render)
  // Client-only: Requires state updates for pagination
  useEffect(() => {
    if (executionsResponse) {
      console.log('OData response received:', executionsResponse)
      const response = executionsResponse

      // Handle exact count from OData
      if (typeof response['@odata.count'] === 'number') {
        setTotalCount(response['@odata.count'])
        totalCountRef.current = response['@odata.count']
        setHasExactCount(true)
        return
      }

      if (Array.isArray(response.value)) {
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
      }
    } else if (fallbackExecutions && fallbackExecutions.length > 0) {
      // Use fallback data length as the count if OData failed
      console.log('Using fallback data count:', fallbackExecutions.length)

      // Apply tab filtering to get accurate count
      const filteredCount = fallbackExecutions.filter((execution) => {
        if (tab === 'inprogress') {
          return (
            execution.status === 'Queued' ||
            execution.status === 'Starting' ||
            execution.status === 'Running'
          )
        } else if (tab === 'historical') {
          return (
            execution.status === 'Completed' ||
            execution.status === 'Failed' ||
            execution.status === 'Cancelled'
          )
        }
        return true
      }).length

      console.log('Filtered fallback count:', filteredCount)
      setTotalCount(filteredCount)
      totalCountRef.current = filteredCount
      setHasExactCount(true)
    }
  }, [executionsResponse, fallbackExecutions, tab, pagination.pageIndex, pagination.pageSize])

  // Handle empty page edge case
  useEffect(() => {
    if (executionsResponse?.value) {
      const isEmptyPageBeyondFirst =
        executionsResponse.value.length === 0 &&
        totalCountRef.current > 0 &&
        pagination.pageIndex > 0

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
    executionsResponse,
    pagination.pageIndex,
    pagination.pageSize,
    totalCountRef,
    updateUrl,
    pathname,
  ])

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

  // Sync URL params with state
  useEffect(() => {
    const page = searchParams.get('page')
    const size = searchParams.get('size')

    if (page && size) {
      const pageIndex = Math.max(0, parseInt(page) - 1)
      const pageSize = parseInt(size)

      // Only update if different to avoid infinite loops
      if (pageIndex !== pagination.pageIndex || pageSize !== pagination.pageSize) {
        console.log(`URL changed: page=${page}, size=${size}. Updating pagination state.`)
        setPagination({
          pageIndex,
          pageSize,
        })
      }
    }
  }, [searchParams, pagination.pageIndex, pagination.pageSize])

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
      executionsData.length === pagination.pageSize &&
      totalCount <= pagination.pageSize * (pagination.pageIndex + 1)

    // Calculate the minimum valid page count
    const minValidPageCount = getMinimumValidPageCount(pagination.pageIndex)

    // Determine final page count
    if (hasMorePages) {
      return Math.max(minValidPageCount, calculatedCount, pagination.pageIndex + 2)
    }

    return Math.max(minValidPageCount, calculatedCount)
  }, [pagination.pageSize, pagination.pageIndex, executionsData.length, totalCount])

  // Helper to check if the count is a reliable total or just a minimum
  const isUnknownTotalCount = useMemo(() => {
    return !hasExactCount && executionsData.length === pagination.pageSize
  }, [hasExactCount, executionsData.length, pagination.pageSize])

  // Define columns based on tab
  let columns
  if (tab === 'inprogress') {
    columns = ProgressColumns
  } else {
    columns = HistoricalColumns
  }

  // Debug logging for table state
  console.log('🔍 Table state debug:', {
    dataLength: executionsData.length,
    columnFilters: columnFilters,
    tab: tab,
    hasActiveFilters: columnFilters.length > 0,
  })

  const table = useReactTable({
    data: executionsData,
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
    // Use manual filtering since we're doing server-side filtering via OData
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
    // Ensure no client-side filtering is applied
    enableColumnFilters: false,
    enableGlobalFilter: false,
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
      // Remove mutateExecutions() - SWR will automatically refetch when the key changes
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
      // Remove mutateExecutions() - SWR will automatically refetch when the key changes
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    pageCount,
    getRowId: (row) => row.id,
  })

  // Implement search with debounce
  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      setIsPending(true)

      if (searchDebounceTimeout.current) clearTimeout(searchDebounceTimeout.current)

      searchDebounceTimeout.current = setTimeout(() => {
        // Use the same column for all tabs - we're searching by Agent name only
        const searchColumn = 'agent'
        const column = table.getColumn(searchColumn)

        if (column) {
          column.setFilterValue(value)

          updateUrl(pathname, {
            search: value || null,
            page: '1', // Reset to first page when filter changes
          })

          // SWR will automatically refetch when the key changes due to URL update
        }

        setIsPending(false)
      }, 500)
    },
    [table, updateUrl, pathname],
  )

  // Handle status filter change
  const handleStatusFilterChange = useCallback(
    (value: string) => {
      const statusColumn = table.getColumn('state')

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

  // Handle SWR errors
  useEffect(() => {
    if (executionsError) {
      console.error('Failed to load executions:', executionsError)

      // Only show toast if fallback also failed
      if (!fallbackExecutions) {
        toast({
          title: 'Error',
          description: 'Failed to load executions. Please try again.',
          variant: 'destructive',
        })
      }
    }
  }, [executionsError, fallbackExecutions, toast])

  // ✅ Auto-refresh data when execution status changes (SIMPLIFIED AND DEBOUNCED)
  useEffect(() => {
    if (Object.keys(executionStatuses).length > 0 && tab === 'inprogress') {
      // Only refresh for In Progress tab and with longer debounce
      const refreshTimeout = setTimeout(() => {
        mutateExecutions()
      }, 3000) // Increased debounce to 3 seconds

      return () => clearTimeout(refreshTimeout)
    }
  }, [executionStatuses, mutateExecutions, tab])

  // Remove periodic refresh - SWR's refreshInterval handles this more efficiently

  // ✅ Auto-adjust page size for In Progress tab to show more executions
  useEffect(() => {
    if (tab === 'inprogress' && pagination.pageSize < 25) {
      setPagination((prev) => ({ ...prev, pageSize: 25 }))
      updateUrl(pathname, { size: '25' })
    }
  }, [tab, pagination.pageSize, setPagination, updateUrl, pathname])

  const handleCreateSuccess = useCallback(
    (newExecution?: { id: string; packageName: string; botAgentName: string }) => {
      // ✅ Following React guideline: API calls in event handlers, not effects

      if (newExecution) {
        // ✅ Optimistic update: immediately add the new execution to the UI
        // The real-time SignalR system will provide updates as the execution progresses

        // ✅ Update SWR cache optimistically using mutate with data
        mutateExecutions((currentData) => {
          if (!currentData) return currentData

          // For OData response structure
          if ('value' in currentData && Array.isArray(currentData.value)) {
            const newExecutionDto: ExecutionResponseDto = {
              id: newExecution.id,
              packageName: newExecution.packageName,
              botAgentName: newExecution.botAgentName,
              status: 'Queued', // Start with Queued status for new executions
              startTime: new Date().toISOString(), // This is already UTC format
              endTime: undefined,
              packageVersion: undefined,
              errorMessage: undefined,
              logOutput: undefined,
              botAgentId: '',
              packageId: '',
              source: 'Manual', // Manual execution source for user-triggered executions
            }

            return {
              ...currentData,
              value: [newExecutionDto, ...currentData.value],
              '@odata.count': (currentData['@odata.count'] || 0) + 1,
            }
          }

          return currentData
        }, false) // false = don't revalidate immediately
      }

      // ✅ Schedule debounced refresh to ensure we get the latest data from server
      // This handles cases where optimistic update might be incomplete
      // Note: We don't return a cleanup function from this callback - that's only for useEffect
      setTimeout(() => {
        console.log('🔄 Refreshing executions after create...')
        mutateExecutions()
      }, 2000) // 2 second delay to allow server processing
    },
    [mutateExecutions],
  )

  const handleCreateClick = () => {
    setIsCreateModalOpen(true)
  }

  const handleRowClick = (row: ExecutionsRow) => {
    const isAdmin = pathname.startsWith('/admin')
    const baseRoute = isAdmin ? `/admin/executions` : `/${tenant}/automation/executions`

    // Route to appropriate tab based on current tab or execution status
    let route = `${baseRoute}/${row.id}`

    // If we have a specific tab active, route to that tab's detail page
    if (tab === 'historical') {
      route = `${baseRoute}/historical/${row.id}`
    } else if (tab === 'inprogress') {
      route = `${baseRoute}/inprogress/${row.id}`
    }

    router.push(route)
  }

  const handleTabChange = (newTab: 'inprogress' | 'historical') => {
    setTab(newTab)
    // Reset pagination to first page when tab changes
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))

    // Set default sorting for Historical tab: newest executions first
    if (newTab === 'historical') {
      setSorting([{ id: 'startTime', desc: true }])
      updateUrl(pathname, {
        page: '1',
        sort: 'startTime',
        order: 'desc',
      })
    } else {
      // Clear sorting for other tabs
      setSorting([])
      updateUrl(pathname, {
        page: '1',
        sort: null,
        order: null,
      })
    }

    // Force reload data immediately when tab changes
    mutateExecutions()
  }

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        {/* Tabs */}
        <div className="mb-4 border-b w-full">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">{t('executions.title')}</h2>
            <div />
            {/* Only show Create Execution button for In Progress tab */}
            {tab === 'inprogress' && (
              <Button onClick={handleCreateClick} className="flex items-center justify-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('executions.createExecution')}
              </Button>
            )}
          </div>

          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              className="px-3 py-2 font-medium text-sm border-b-2 border-transparent hover:border-primary hover:text-primary data-[active=true]:border-primary data-[active=true]:text-primary"
              data-active={tab === 'inprogress'}
              type="button"
              onClick={() => handleTabChange('inprogress')}
            >
              {t('executions.tabs.inProgress')}
            </button>
            <button
              className="px-3 py-2 font-medium text-sm border-b-2 border-transparent hover:border-primary hover:text-primary data-[active=true]:border-primary data-[active=true]:text-primary"
              data-active={tab === 'historical'}
              type="button"
              onClick={() => handleTabChange('historical')}
            >
              {t('executions.tabs.historical')}
            </button>
          </nav>
        </div>

        {executionsError && !fallbackExecutions && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300">{t('executions.errors.loadFailed')}</p>
            <Button variant="outline" className="mt-2" onClick={() => mutateExecutions()}>
              {t('executions.errors.retry')}
            </Button>
          </div>
        )}

        {/* Tab Content */}
        {tab === 'inprogress' && (
          <>
            <ProgressToolbar
              table={table}
              statuses={[
                { value: 'Queued', label: t('executions.status.queued') },
                { value: 'Starting', label: t('executions.status.starting') },
                { value: 'Running', label: t('executions.status.running') },
              ]}
              onSearch={handleSearch}
              onStatusChange={handleStatusFilterChange}
              searchValue={searchValue}
              isFiltering={isDataLoading}
              isPending={isPending}
            />

            <DataTable
              data={executionsData}
              columns={ProgressColumns}
              onRowClick={handleRowClick}
              table={table}
              isLoading={isDataLoading}
              totalCount={totalCount}
            />
          </>
        )}

        

        {tab === 'historical' && (
          <>
            <HistoricalToolbar
              table={table}
              statuses={[
                { value: 'Completed', label: t('executions.status.completed') },
                { value: 'Failed', label: t('executions.status.failed') },
                { value: 'Cancelled', label: t('executions.status.cancelled') },
              ]}
              onSearch={handleSearch}
              onStatusChange={handleStatusFilterChange}
              searchValue={searchValue}
              isFiltering={isDataLoading}
              isPending={isPending}
            />
            <DataTable
              data={executionsData}
              columns={HistoricalColumns}
              onRowClick={handleRowClick}
              table={table}
              isLoading={isDataLoading}
              totalCount={totalCount}
            />
          </>
        )}

        <Pagination
          currentPage={pagination.pageIndex + 1}
          pageSize={pagination.pageSize}
          totalCount={totalCount}
          totalPages={pageCount}
          isLoading={isDataLoading}
          isChangingPageSize={isChangingPageSize}
          isUnknownTotalCount={isUnknownTotalCount}
          onPageChange={(page: number) => {
            console.log(`Page change requested to page ${page}`)

            // Update pagination state
            setPagination((prev) => ({
              ...prev,
              pageIndex: page - 1,
            }))

            // Update URL
            updateUrl(pathname, { page: page.toString() })

            // Force immediate data reload with new pagination
            console.log('Reloading data after page change')
            setTimeout(() => {
              mutateExecutions()
            }, 0)
          }}
          onPageSizeChange={(size: number) => {
            console.log(`Page size change requested to ${size}`)
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
            console.log('Reloading data after page size change')
            setTimeout(() => {
              mutateExecutions()
            }, 0)
          }}
        />
      </div>

      {/* Create Execution Modal */}
      <CreateExecutionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  )
}
