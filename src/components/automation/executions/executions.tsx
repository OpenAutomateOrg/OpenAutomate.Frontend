'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createColumns as createHistoricalColumns } from './historical/columns'
import { createInProgressColumns } from './inProgress/columns'
import { createScheduledColumns } from './scheduled/columns'
import { DataTable } from '@/components/layout/table/data-table'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import CreateExecutionModal from './create-execution-modal'

import { z } from 'zod'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { DataTableToolbar as HistoricalToolbar } from './historical/data-table-toolbar'
import { DataTableToolbar as ProgressToolbar } from './inProgress/data-table-toolbar'
import { DataTableToolbar as ScheduledToolbar } from './scheduled/data-table-toolbar'
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
  const [tab, setTab] = useState<'inprogress' | 'scheduled' | 'historical'>('inprogress')
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

    const searchFilter = searchParams.get('search')
    if (searchFilter) {
      if (tab === 'inprogress' || tab === 'historical') {
        filters.push({ id: 'agent', value: searchFilter })
      } else {
        filters.push({ id: 'packageName', value: searchFilter })
      }
    }

    const statusFilter = searchParams.get('status')
    if (statusFilter) filters.push({ id: 'state', value: statusFilter })

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
              return `state eq '${value}'`
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
        tabFilter = "status eq 'Running' or status eq 'Pending'"
        break
      case 'scheduled':
        tabFilter = "status eq 'Scheduled'"
        break
      case 'historical':
        tabFilter = "status eq 'Completed' or status eq 'Failed' or status eq 'Cancelled'"
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
    dedupingInterval: 0, // Disable deduping to ensure fresh data on pagination change
    revalidateOnFocus: false, // Prevent auto revalidation on window focus
    revalidateIfStale: false, // Only revalidate when explicitly called
    keepPreviousData: false, // Don't keep previous data when fetching new data
  })

  // Fallback to regular executions API if OData fails or returns empty data
  const { data: fallbackExecutions } = useSWR(
    executionsResponse?.value?.length === 0 || executionsError ? swrKeys.executions() : null,
    getAllExecutions,
  )

  // Debug logging for data sources
  console.log('📊 Data source debug:', {
    hasODataResponse: !!executionsResponse?.value,
    oDataCount: executionsResponse?.value?.length || 0,
    hasFallback: !!fallbackExecutions,
    fallbackCount: fallbackExecutions?.length || 0,
    hasError: !!executionsError,
  })

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
        Source: 'Manual', // Assuming manual trigger for now
        Command: 'execute',
        Schedules: 'Once', // For immediate executions
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
        source: 'Manual',
        command: 'execute',
        schedules: 'Once',
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
        t,
        onDeleted: () => {
          void mutateExecutions()
        },
      }),
    [mutateExecutions, t],
  )

  const ScheduledColumns = useMemo(() => createScheduledColumns({ t }), [t])

  const HistoricalColumns = useMemo(
    () =>
      createHistoricalColumns({
        t,
        onDeleted: () => {
          void mutateExecutions()
        },
      }),
    [mutateExecutions, t],
  )

  // ✅ SWR automatically refetches when queryParams change, no manual reload needed
  // Removed problematic useEffect hooks that caused infinite loops

  // Transform data during render
  const executions = useMemo(() => {
    // Use fallback data if OData response is empty
    if (
      fallbackExecutions &&
      (!executionsResponse?.value || executionsResponse.value.length === 0)
    ) {
      console.log('⚠️ Using fallback data - this will ignore OData sorting!', pagination)

      // Transform fallback data
      const transformedData = fallbackExecutions.map((execution) =>
        transformExecutionToRow(execution),
      )

      // Apply manual filtering for fallback data
      let filteredData = transformedData

      // 1. Apply tab filtering
      filteredData = filteredData.filter((row) => {
        if (tab === 'inprogress') {
          return row.state === 'Running' || row.state === 'Pending'
        } else if (tab === 'scheduled') {
          return row.state === 'Scheduled'
        } else if (tab === 'historical') {
          return row.state === 'Completed' || row.state === 'Failed' || row.state === 'Cancelled'
        }
        return true
      })

      // 1.5. Apply sorting to fallback data (since OData sorting is not available)
      if (sorting.length > 0) {
        filteredData.sort((a, b) => {
          const sort = sorting[0] // Take first sort
          const aValue = a[sort.id as keyof ExecutionsRow]
          const bValue = b[sort.id as keyof ExecutionsRow]

          // Handle date sorting for startTime/endTime
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
        console.log(
          `🔄 Applied client-side sorting: ${sorting[0].id} ${sorting[0].desc ? 'desc' : 'asc'}`,
        )
      }

      // 2. Apply search filtering if search value exists - search by Agent only
      if (searchValue) {
        filteredData = filteredData.filter((row) => {
          const agentMatch = row.agent?.toLowerCase().includes(searchValue.toLowerCase())
          return agentMatch
        })
      }

      // 3. Apply state filter if exists
      const stateFilter = columnFilters.find((filter) => filter.id === 'state')?.value as string
      if (stateFilter) {
        filteredData = filteredData.filter((row) => row.state === stateFilter)
      }

      // Store filtered data length for later use in useEffect
      const filteredLength = filteredData.length

      // 4. Apply pagination manually for fallback data
      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize

      console.log(
        `Slicing fallback data from ${start} to ${end} out of ${filteredData.length} items`,
      )

      const paginatedData = filteredData.slice(start, end)
      console.log(`Returning ${paginatedData.length} items from fallback data`)

      // Set totalCount outside of useMemo to avoid circular dependency
      if (totalCount !== filteredLength) {
        // Queue an update for the next render cycle
        setTimeout(() => {
          setTotalCount(filteredLength)
          totalCountRef.current = filteredLength
        }, 0)
      }

      return paginatedData
    }

    // Otherwise use OData response
    if (!executionsResponse?.value) {
      console.log('No data available from OData or fallback')
      return []
    }

    console.log(
      `✅ Using OData response with ${executionsResponse.value.length} items (sorting preserved)`,
    )
    console.log(
      '📋 First 3 execution start times:',
      executionsResponse.value.slice(0, 3).map((e) => ({
        id: e.id.substring(0, 8),
        startTime: e.startTime,
        status: e.status,
      })),
    )
    return executionsResponse.value.map((execution) => transformExecutionToRow(execution))
  }, [
    executionsResponse,
    fallbackExecutions,
    transformExecutionToRow,
    tab,
    searchValue,
    columnFilters,
    pagination,
    totalCount,
    sorting, // Add sorting dependency for client-side sorting
  ])

  // Update totalCount from filteredData in a separate useEffect
  useEffect(() => {
    if (
      fallbackExecutions &&
      (!executionsResponse?.value || executionsResponse.value.length === 0)
    ) {
      // Calculate filtered length using same logic as in useMemo
      let filteredData = fallbackExecutions.map((execution) => transformExecutionToRow(execution))

      // Apply tab filtering
      filteredData = filteredData.filter((row) => {
        if (tab === 'inprogress') {
          return row.state === 'Running' || row.state === 'Pending'
        } else if (tab === 'scheduled') {
          return row.state === 'Scheduled'
        } else if (tab === 'historical') {
          return row.state === 'Completed' || row.state === 'Failed' || row.state === 'Cancelled'
        }
        return true
      })

      // Apply search filtering
      if (searchValue) {
        filteredData = filteredData.filter((row) => {
          const agentMatch = row.agent?.toLowerCase().includes(searchValue.toLowerCase())
          return agentMatch
        })
      }

      // Apply state filter
      const stateFilter = columnFilters.find((filter) => filter.id === 'state')?.value as string
      if (stateFilter) {
        filteredData = filteredData.filter((row) => row.state === stateFilter)
      }

      // Update total count if different
      if (totalCount !== filteredData.length) {
        console.log('Updating total count from fallback data:', filteredData.length)
        setTotalCount(filteredData.length)
        totalCountRef.current = filteredData.length
      }
    }
  }, [
    fallbackExecutions,
    executionsResponse,
    transformExecutionToRow,
    tab,
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
          return execution.status === 'Running' || execution.status === 'Pending'
        } else if (tab === 'scheduled') {
          return execution.status === 'Scheduled'
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
  } else if (tab === 'scheduled') {
    columns = ScheduledColumns
  } else {
    columns = HistoricalColumns
  }

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
      mutateExecutions()
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      console.log('Pagination change triggered')
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater
      console.log('Current pagination:', pagination, 'New pagination:', newPagination)

      setPagination(newPagination)
      updateUrl(pathname, {
        page: (newPagination.pageIndex + 1).toString(),
        size: newPagination.pageSize.toString(),
      })

      console.log('Forcing data reload for pagination change')
      mutateExecutions()
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
        const searchColumn = tab === 'scheduled' ? 'packageName' : 'agent'
        const column = table.getColumn(searchColumn)

        if (column) {
          column.setFilterValue(value)

          updateUrl(pathname, {
            search: value || null,
            page: '1', // Reset to first page when filter changes
          })

          // Force reload data when search changes
          mutateExecutions()
        }

        setIsPending(false)
      }, 500)
    },
    [table, updateUrl, pathname, tab, mutateExecutions],
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

  // ✅ Auto-refresh data when execution status changes to terminal states
  // Client-only: Real-time data synchronization
  useEffect(() => {
    const terminalStatuses = ['Completed', 'Failed', 'Cancelled']
    const hasTerminalUpdate = Object.values(executionStatuses).some((status) =>
      terminalStatuses.includes(status.status),
    )

    if (hasTerminalUpdate) {
      // Debounce the refresh to avoid excessive API calls
      const refreshTimeout = setTimeout(() => {
        mutateExecutions()
      }, 1000)

      return () => clearTimeout(refreshTimeout)
    }
  }, [executionStatuses, mutateExecutions])

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
              status: 'Pending',
              startTime: new Date().toISOString(), // This is already UTC format
              endTime: undefined,
              packageVersion: undefined,
              errorMessage: undefined,
              logOutput: undefined,
              botAgentId: '',
              packageId: '',
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
    } else if (tab === 'scheduled') {
      route = `${baseRoute}/scheduled/${row.id}`
    }

    router.push(route)
  }

  const handleTabChange = (newTab: 'inprogress' | 'scheduled' | 'historical') => {
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
              data-active={tab === 'scheduled'}
              type="button"
              onClick={() => handleTabChange('scheduled')}
            >
              {t('executions.tabs.scheduled')}
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

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">{t('executions.title')}</h2>
          <div className="flex items-center space-x-2">
            {/* Only show Create Execution button for In Progress tab */}
            {tab === 'inprogress' && (
              <Button onClick={handleCreateClick} className="flex items-center justify-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('executions.createExecution')}
              </Button>
            )}
          </div>
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
                { value: 'Running', label: t('executions.status.running') },
                { value: 'Pending', label: t('executions.status.pending') },
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
        {tab === 'scheduled' && (
          <>
            <ScheduledToolbar
              table={table}
              statuses={[{ value: 'Scheduled', label: t('executions.status.scheduled') }]}
              onSearch={handleSearch}
              onStatusChange={handleStatusFilterChange}
              searchValue={searchValue}
              isFiltering={isDataLoading}
              isPending={isPending}
            />
            <DataTable
              data={executionsData}
              columns={ScheduledColumns}
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
