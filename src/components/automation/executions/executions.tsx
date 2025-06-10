'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns as HistoricalColumns } from './historical/columns'
import { columns as ProgressColumns } from './inProgress/columns'
import { columns as ScheduledColumns } from './scheduled/columns'
import { DataTable } from '@/components/layout/table/data-table'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import CreateExecutionModal from './CreateExecutionModal'

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
  ODataResponse 
} from '@/lib/api/executions'
import useSWR from 'swr'
import { swrKeys } from '@/lib/swr-config'
import { useUrlParams } from '@/hooks/use-url-params'
import { Pagination } from '@/components/ui/pagination'

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
})

export type ExecutionsRow = z.infer<typeof executionsSchema>

export default function ExecutionsInterface() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { updateUrl } = useUrlParams()
  const { toast } = useToast()

  // UI State management
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [tab, setTab] = useState<'inprogress' | 'sheduled' | 'historical'>('inprogress')
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

    return []
  }

  const initPagination = (): PaginationState => {
    const page = searchParams.get('page')
    const size = searchParams.get('size')

    // Always enforce a valid page size, defaulting to 10
    const pageSize = size ? Math.max(1, parseInt(size)) : 10
    
    console.log(`Initializing pagination from URL: page=${page}, size=${size}, pageSize=${pageSize}`)
    
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
    let tabFilter = '';
    switch (tab) {
      case 'inprogress':
        tabFilter = "status eq 'Running' or status eq 'Pending'"
        break;
      case 'sheduled':
        tabFilter = "status eq 'Scheduled'"
        break;
      case 'historical':
        tabFilter = "status eq 'Completed' or status eq 'Failed' or status eq 'Cancelled'"
        break;
    }
    
    if (tabFilter) {
      params.$filter = params.$filter 
        ? `(${params.$filter}) and (${tabFilter})` 
        : tabFilter
    }

    return params
  }, [pagination, sorting, columnFilters, tab])

  // SWR for executions data with OData query
  const queryParams = getODataQueryParams()
  const swrKey = useMemo(() => swrKeys.executionsWithOData(queryParams as Record<string, unknown>), 
    [queryParams]);

  const { data: executionsResponse, error: executionsError, isLoading, mutate: mutateExecutions } = useSWR(
    swrKey,
    () => getExecutionsWithOData(queryParams),
    {
      dedupingInterval: 0, // Disable deduping to ensure fresh data on pagination change
      revalidateOnFocus: false, // Prevent auto revalidation on window focus
      revalidateIfStale: false, // Only revalidate when explicitly called
      keepPreviousData: false, // Don't keep previous data when fetching new data
    }
  )

  // Force reload when pagination changes
  useEffect(() => {
    console.log('Pagination changed, forcing reload with params:', queryParams);
    mutateExecutions();
  }, [pagination.pageIndex, pagination.pageSize, mutateExecutions, queryParams]);

  // Force reload when tab changes
  useEffect(() => {
    console.log('Tab changed to', tab, 'forcing reload');
    mutateExecutions();
  }, [tab, mutateExecutions]);

  // Fallback to regular executions API if OData fails or returns empty data
  const { data: fallbackExecutions } = useSWR(
    executionsResponse?.value?.length === 0 || executionsError ? swrKeys.executions() : null,
    getAllExecutions
  )
  
  // Combined loading state
  const isDataLoading = isLoading || (executionsError && !fallbackExecutions)

  // Define transformation function before using it in useMemo
  const transformExecutionToRow = useCallback((execution: ExecutionResponseDto): ExecutionsRow => {
    return {
      id: execution.id,
      Version: execution.packageVersion || '',
      Agent: execution.botAgentName || '',
      State: execution.status,
      'Start Time': execution.startTime ? new Date(execution.startTime).toLocaleString() : '',
      'End Time': execution.endTime ? new Date(execution.endTime).toLocaleString() : '',
      Source: 'Manual', // Assuming manual trigger for now
      Command: 'execute',
      Schedules: 'Once', // For immediate executions
      'Task Id': execution.id,
      'Created Date': execution.startTime ? new Date(execution.startTime).toLocaleDateString() : '',
      'Created By': 'Current User', // TODO: Get from auth context when available

      // Legacy fields for compatibility
      name: execution.packageName || '',
      type: 'execution',
      value: execution.packageVersion || '',
      createdBy: 'Current User',
      label: execution.botAgentName || '',
      status: execution.status,
      agent: execution.botAgentName || '',
      state: execution.status,
      startTime: execution.startTime ? new Date(execution.startTime).toLocaleString() : '',
      endTime: execution.endTime ? new Date(execution.endTime).toLocaleString() : '',
      source: 'Manual',
      command: 'execute',
      schedules: 'Once',
      taskId: execution.id,
      createdDate: execution.startTime ? new Date(execution.startTime).toLocaleDateString() : '',
      packageName: execution.packageName || '',
    }
  }, [])

  // Transform data during render
  const executions = useMemo(() => {
    // Use fallback data if OData response is empty
    if (fallbackExecutions && (!executionsResponse?.value || executionsResponse.value.length === 0)) {
      console.log('Using fallback data with pagination:', pagination);
      
      // Transform fallback data
      const transformedData = fallbackExecutions.map(execution => transformExecutionToRow(execution))
      
      // Apply manual filtering for fallback data
      let filteredData = transformedData
      
      // 1. Apply tab filtering
      filteredData = filteredData.filter(row => {
        if (tab === 'inprogress') {
          return row.state === 'Running' || row.state === 'Pending'
        } else if (tab === 'sheduled') {
          return row.state === 'Scheduled'
        } else if (tab === 'historical') {
          return row.state === 'Completed' || row.state === 'Failed' || row.state === 'Cancelled'
        }
        return true
      })
      
      // 2. Apply search filtering if search value exists - search by Agent only
      if (searchValue) {
        filteredData = filteredData.filter(row => {
          const agentMatch = row.agent && row.agent.toLowerCase().includes(searchValue.toLowerCase());
          return agentMatch;
        })
      }
      
      // 3. Apply state filter if exists
      const stateFilter = columnFilters.find(filter => filter.id === 'state')?.value as string
      if (stateFilter) {
        filteredData = filteredData.filter(row => row.state === stateFilter)
      }
      
      // Store total count for pagination
      if (totalCount !== filteredData.length) {
        console.log('Updating total count from fallback data:', filteredData.length);
        setTimeout(() => {
          setTotalCount(filteredData.length)
          totalCountRef.current = filteredData.length
        }, 0);
      }
      
      // 4. Apply pagination manually for fallback data
      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize
      
      console.log(`Slicing fallback data from ${start} to ${end} out of ${filteredData.length} items`);
      
      const paginatedData = filteredData.slice(start, end)
      console.log(`Returning ${paginatedData.length} items from fallback data`);
      
      return paginatedData
    }
    
    // Otherwise use OData response
    if (!executionsResponse?.value) {
      console.log('No data available from OData or fallback');
      return []
    }
    
    console.log(`Returning ${executionsResponse.value.length} items from OData response`);
    return executionsResponse.value.map(execution => transformExecutionToRow(execution))
  }, [executionsResponse, fallbackExecutions, transformExecutionToRow, tab, searchValue, columnFilters, pagination, totalCount]);

  // Helper function to update counts based on OData response
  const updateTotalCounts = useCallback((response: ODataResponse<ExecutionResponseDto>) => {
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
  }, [pagination.pageIndex, pagination.pageSize])

  // Update total count when data changes
  useEffect(() => {
    if (executionsResponse) {
      console.log('OData response received:', executionsResponse)
      updateTotalCounts(executionsResponse)
    } else if (fallbackExecutions && fallbackExecutions.length > 0) {
      // Use fallback data length as the count if OData failed
      console.log('Using fallback data count:', fallbackExecutions.length)
      
      // Apply tab filtering to get accurate count
      const filteredCount = fallbackExecutions.filter(execution => {
        if (tab === 'inprogress') {
          return execution.status === 'Running' || execution.status === 'Pending'
        } else if (tab === 'sheduled') {
          return execution.status === 'Scheduled'
        } else if (tab === 'historical') {
          return execution.status === 'Completed' || execution.status === 'Failed' || execution.status === 'Cancelled'
        }
        return true
      }).length
      
      console.log('Filtered fallback count:', filteredCount)
      setTotalCount(filteredCount)
      totalCountRef.current = filteredCount
      setHasExactCount(true)
    }
  }, [executionsResponse, fallbackExecutions, updateTotalCounts, tab])

  // Handle empty page edge case
  useEffect(() => {
    if (executionsResponse?.value) {
      const isEmptyPageBeyondFirst =
        executionsResponse.value.length === 0 && totalCountRef.current > 0 && pagination.pageIndex > 0

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
  }, [executionsResponse, pagination.pageIndex, pagination.pageSize, totalCountRef, updateUrl, pathname])

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
          pageSize
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
      executions.length === pagination.pageSize &&
      totalCount <= pagination.pageSize * (pagination.pageIndex + 1)

    // Calculate the minimum valid page count
    const minValidPageCount = getMinimumValidPageCount(pagination.pageIndex)

    // Determine final page count
    if (hasMorePages) {
      return Math.max(minValidPageCount, calculatedCount, pagination.pageIndex + 2)
    }

    return Math.max(minValidPageCount, calculatedCount)
  }, [pagination.pageSize, pagination.pageIndex, executions.length, totalCount])

  // Helper to check if the count is a reliable total or just a minimum
  const isUnknownTotalCount = useMemo(() => {
    return !hasExactCount && executions.length === pagination.pageSize
  }, [hasExactCount, executions.length, pagination.pageSize])

  // Define columns based on tab
  const columns =
    tab === 'inprogress'
      ? ProgressColumns
      : tab === 'sheduled'
        ? ScheduledColumns
        : HistoricalColumns

  const table = useReactTable({
    data: executions,
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
        const searchColumn = tab === 'sheduled' ? 'packageName' : 'agent'
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
    [table, updateUrl, pathname, tab, mutateExecutions]
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
    [table, updateUrl, pathname]
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

  const handleCreateSuccess = () => {
    // Refresh the data after successful execution creation
    mutateExecutions()
  }

  const handleCreateClick = () => {
    setIsCreateModalOpen(true)
  }

  const handleRowClick = (row: ExecutionsRow) => {
    const isAdmin = pathname.startsWith('/admin')
    const route = isAdmin ? `/admin/executions/${row.id}` : `/${tenant}/executions/${row.id}`
    router.push(route)
  }

  const handleTabChange = (newTab: 'inprogress' | 'sheduled' | 'historical') => {
    setTab(newTab)
    // Reset pagination to first page when tab changes
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    updateUrl(pathname, { page: '1' })
    
    // Force reload data immediately when tab changes
    mutateExecutions()
  }

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        {/* Tabs */}
        <div className="mb-4 border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              className="px-3 py-2 font-medium text-sm border-b-2 border-transparent hover:border-primary hover:text-primary data-[active=true]:border-primary data-[active=true]:text-primary"
              data-active={tab === 'inprogress'}
              type="button"
              onClick={() => handleTabChange('inprogress')}
            >
              In Progress
            </button>
            <button
              className="px-3 py-2 font-medium text-sm border-b-2 border-transparent hover:border-primary hover:text-primary data-[active=true]:border-primary data-[active=true]:text-primary"
              data-active={tab === 'sheduled'}
              type="button"
              onClick={() => handleTabChange('sheduled')}
            >
              Scheduled
            </button>
            <button
              className="px-3 py-2 font-medium text-sm border-b-2 border-transparent hover:border-primary hover:text-primary data-[active=true]:border-primary data-[active=true]:text-primary"
              data-active={tab === 'historical'}
              type="button"
              onClick={() => handleTabChange('historical')}
            >
              Historical
            </button>
          </nav>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Executions</h2>
          <div className="flex items-center space-x-2">
            {totalCount > 0 && (
              <div className="text-sm text-muted-foreground">
                <span>
                  Total: {totalCount} execution{totalCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            <Button
              onClick={handleCreateClick}
              className="flex items-center justify-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Execution
            </Button>
          </div>
        </div>

        {executionsError && !fallbackExecutions && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300">Failed to load executions. Please try again.</p>
            <Button variant="outline" className="mt-2" onClick={() => mutateExecutions()}>
              Retry
            </Button>
          </div>
        )}

        {/* Tab Content */}
        {tab === 'inprogress' && (
          <>
            <ProgressToolbar
              table={table}
              statuses={[
                { value: 'Running', label: 'Running' },
                { value: 'Pending', label: 'Pending' },
              ]}
              onSearch={handleSearch}
              onStatusChange={handleStatusFilterChange}
              searchValue={searchValue}
              isFiltering={isDataLoading}
              isPending={isPending}
              searchPlaceholder="Search by Agent..."
            />
            <DataTable
              data={executions}
              columns={ProgressColumns}
              onRowClick={handleRowClick}
              table={table}
              isLoading={isDataLoading}
              totalCount={totalCount}
            />
          </>
        )}
        {tab === 'sheduled' && (
          <>
            <ScheduledToolbar
              table={table}
              statuses={[{ value: 'Scheduled', label: 'Scheduled' }]}
              onSearch={handleSearch}
              onStatusChange={handleStatusFilterChange}
              searchValue={searchValue}
              isFiltering={isDataLoading}
              isPending={isPending}
              searchPlaceholder="Search by Agent..."
            />
            <DataTable
              data={executions}
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
                { value: 'Completed', label: 'Completed' },
                { value: 'Failed', label: 'Failed' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
              onSearch={handleSearch}
              onStatusChange={handleStatusFilterChange}
              searchValue={searchValue}
              isFiltering={isDataLoading}
              isPending={isPending}
              searchPlaceholder="Search by Agent..."
            />
            <DataTable
              data={executions}
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
            setPagination(prev => ({
              ...prev,
              pageIndex: page - 1
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

        {!isDataLoading && executions.length === 0 && !executionsError && (
          <div className="text-center py-10 text-muted-foreground">
            <p>No executions found.</p>
          </div>
        )}
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