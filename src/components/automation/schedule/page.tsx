'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createScheduleColumns } from './schedule/columns'
import { DataTable } from '@/components/layout/table/data-table'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { CreateEditModal as ScheduleModal } from './schedule/create-edit-modal'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { DataTableToolbar } from './schedule/data-table-toolbar'
import { useToast } from '@/components/ui/use-toast'
import {
  getSchedulesWithOData,
  getAllSchedules,
  ScheduleResponseDto,
  ODataQueryOptions,
  ODataResponse,
  RecurrenceType,
  getRecurrenceTypeDisplayName,
  enableSchedule,
  disableSchedule,
} from '@/lib/api/schedules'
import useSWR from 'swr'
import { swrKeys } from '@/lib/swr-config'
import { useUrlParams } from '@/hooks/use-url-params'
import { Pagination } from '@/components/ui/pagination'
import { createErrorToast } from '@/lib/utils/error-utils'

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

import type { ScheduleFormData } from './schedule/create-edit-modal'

// Định nghĩa local ScheduleData đúng chuẩn modal
interface ScheduleData {
  id?: string
  name?: string
  packageId?: string
  packageVersion?: string
  agentId?: string
  timezone?: string
  recurrence?: Partial<ScheduleFormData['recurrence']>
}

function mapApiScheduleToEditingSchedule(apiSchedule: ScheduleResponseDto): ScheduleData {
  const recurrenceType = apiSchedule.recurrenceType as RecurrenceType
  return {
    id: apiSchedule.id,
    name: apiSchedule.name,
    packageId: apiSchedule.automationPackageId,
    packageVersion: 'latest',
    agentId: apiSchedule.botAgentId,
    timezone: apiSchedule.timeZoneId,
    recurrence: { type: recurrenceType },
  }
}

export default function ScheduleInterface() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { updateUrl } = useUrlParams()
  const { toast } = useToast()

  // UI State management
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduleData | null>(null)
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
      filters.push({ id: 'name', value: searchFilter })
    }

    const statusFilter = searchParams.get('status')
    if (statusFilter) filters.push({ id: 'isEnabled', value: statusFilter })

    const typeFilter = searchParams.get('type')
    if (typeFilter) filters.push({ id: 'recurrenceType', value: typeFilter })

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

  // Extract tenant from pathname (e.g., /tenant/automation/schedule)
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
            // Search by name
            if (column === 'name' && value) {
              return `contains(tolower(name), '${value.toLowerCase()}')`
            }
            if (column === 'isEnabled' && value) {
              return `isEnabled eq ${value === 'enabled' ? 'true' : 'false'}`
            }
            if (column === 'recurrenceType' && value) {
              return `recurrenceType eq '${value}'`
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

  // SWR for schedules data with OData query
  const queryParams = getODataQueryParams()
  const swrKey = useMemo(
    () => swrKeys.schedulesWithOData(queryParams as Record<string, unknown>),
    [queryParams],
  )

  const {
    data: schedulesResponse,
    error: schedulesError,
    isLoading,
    mutate: mutateSchedules,
  } = useSWR(swrKey, () => getSchedulesWithOData(queryParams), {
    dedupingInterval: 0, // Disable deduping to ensure fresh data on pagination change
    revalidateOnFocus: false, // Prevent auto revalidation on window focus
    revalidateIfStale: true, // Allow revalidation when data is stale
    keepPreviousData: false, // Don't keep previous data when fetching new data
  })

  // Fallback to regular schedules API if OData fails or returns empty data
  const { data: fallbackSchedules, mutate: mutateFallbackSchedules } = useSWR(
    schedulesResponse?.value?.length === 0 || schedulesError ? swrKeys.schedules() : null,
    getAllSchedules,
  )

  // Combined loading state
  const isDataLoading = isLoading || (schedulesError && !fallbackSchedules)

  // Transform data during render
  const schedules = useMemo(() => {
    // Use fallback data if OData response is empty
    if (fallbackSchedules && (!schedulesResponse?.value || schedulesResponse.value.length === 0)) {
      console.log('Using fallback data with pagination:', pagination)

      // Apply manual filtering for fallback data
      let filteredData = fallbackSchedules

      // Apply search filtering if search value exists
      if (searchValue) {
        filteredData = filteredData.filter((schedule) => {
          const nameMatch =
            schedule.name && schedule.name.toLowerCase().includes(searchValue.toLowerCase())
          return nameMatch
        })
      }

      // Apply status filter if exists
      const statusFilter = columnFilters.find((filter) => filter.id === 'isEnabled')
        ?.value as string
      if (statusFilter && statusFilter !== 'all') {
        filteredData = filteredData.filter((schedule) => {
          if (statusFilter === 'enabled') return schedule.isEnabled
          if (statusFilter === 'disabled') return !schedule.isEnabled
          return true
        })
      }

      // Apply recurrence type filter if exists
      const typeFilter = columnFilters.find((filter) => filter.id === 'recurrenceType')
        ?.value as string
      if (typeFilter && typeFilter !== 'all') {
        filteredData = filteredData.filter((schedule) => schedule.recurrenceType === typeFilter)
      }

      // Store filtered data length for later use in useEffect
      const filteredLength = filteredData.length

      // Apply pagination manually for fallback data
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
    if (!schedulesResponse?.value) {
      console.log('No data available from OData or fallback')
      return []
    }

    console.log(`Returning ${schedulesResponse.value.length} items from OData response`)
    return schedulesResponse.value
  }, [schedulesResponse, fallbackSchedules, searchValue, columnFilters, pagination, totalCount])

  // Helper function to handle estimated count from response
  const handleEstimatedCount = useCallback(
    (responseValue: ScheduleResponseDto[]) => {
      const minCount = pagination.pageIndex * pagination.pageSize + responseValue.length

      // Only update if the new minimum count is higher than current
      if (minCount > totalCountRef.current) {
        setTotalCount(minCount)
        totalCountRef.current = minCount
      }

      // If we got a full page on first page, assume there might be more
      const isFullFirstPage =
        responseValue.length === pagination.pageSize && pagination.pageIndex === 0
      if (isFullFirstPage) {
        setTotalCount(minCount + 1) // Indicate there might be more
        totalCountRef.current = minCount + 1
      }

      setHasExactCount(false)
    },
    [pagination.pageIndex, pagination.pageSize],
  )

  // Helper function to handle OData response count
  const handleODataResponse = useCallback(
    (response: ODataResponse<ScheduleResponseDto>) => {
      console.log('OData response received:', response)

      // Handle exact count from OData
      if (typeof response['@odata.count'] === 'number') {
        setTotalCount(response['@odata.count'])
        totalCountRef.current = response['@odata.count']
        setHasExactCount(true)
        return
      }

      if (Array.isArray(response.value)) {
        handleEstimatedCount(response.value)
      }
    },
    [handleEstimatedCount],
  )

  // Helper function to handle fallback schedules count
  const handleFallbackCount = useCallback(() => {
    if (!fallbackSchedules || fallbackSchedules.length === 0) return

    console.log('Using fallback data count:', fallbackSchedules.length)
    let filteredCount = fallbackSchedules.length

    // Apply search filtering
    if (searchValue) {
      filteredCount = fallbackSchedules.filter((schedule) => {
        const nameMatch =
          schedule.name && schedule.name.toLowerCase().includes(searchValue.toLowerCase())
        return nameMatch
      }).length
    }

    // Apply status filter
    const statusFilter = columnFilters.find((filter) => filter.id === 'isEnabled')?.value as string
    if (statusFilter && statusFilter !== 'all') {
      filteredCount = fallbackSchedules.filter((schedule) => {
        if (statusFilter === 'enabled') return schedule.isEnabled
        if (statusFilter === 'disabled') return !schedule.isEnabled
        return true
      }).length
    }

    console.log('Filtered fallback count:', filteredCount)
    setTotalCount(filteredCount)
    totalCountRef.current = filteredCount
    setHasExactCount(true)
  }, [fallbackSchedules, searchValue, columnFilters])

  // Update totalCount from OData response or filtered fallback data
  useEffect(() => {
    if (schedulesResponse) {
      handleODataResponse(schedulesResponse)
    } else {
      handleFallbackCount()
    }
  }, [schedulesResponse, handleODataResponse, handleFallbackCount])

  // Handle empty page edge case
  useEffect(() => {
    if (schedulesResponse?.value) {
      const isEmptyPageBeyondFirst =
        schedulesResponse.value.length === 0 &&
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
    schedulesResponse,
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
      schedules.length === pagination.pageSize &&
      totalCount <= pagination.pageSize * (pagination.pageIndex + 1)

    // Calculate the minimum valid page count
    const minValidPageCount = getMinimumValidPageCount(pagination.pageIndex)

    // Determine final page count
    if (hasMorePages) {
      return Math.max(minValidPageCount, calculatedCount, pagination.pageIndex + 2)
    }

    return Math.max(minValidPageCount, calculatedCount)
  }, [pagination.pageSize, pagination.pageIndex, schedules.length, totalCount])

  // Helper to check if the count is a reliable total or just a minimum
  const isUnknownTotalCount = useMemo(() => {
    return !hasExactCount && schedules.length === pagination.pageSize
  }, [hasExactCount, schedules.length, pagination.pageSize])

  // ✅ Create columns with proper handlers
  const columns = useMemo(
    () =>
      createScheduleColumns({
        onDeleted: () => {
          mutateSchedules()
          mutateFallbackSchedules()
        },
        onToggleEnabled: async (schedule: ScheduleResponseDto) => {
          try {
            const updatedSchedule = schedule.isEnabled
              ? await disableSchedule(schedule.id)
              : await enableSchedule(schedule.id)

            // Show success toast with subtle feedback
            toast({
              title: `Schedule ${updatedSchedule.isEnabled ? 'Enabled' : 'Disabled'}`,
              description: `"${schedule.name}" is now ${updatedSchedule.isEnabled ? 'active' : 'inactive'}.`,
              duration: 3000, // Show for 3 seconds
            })

            // Force immediate refresh of both data sources to ensure UI updates
            console.log('Refreshing both data sources after toggle...')
            await Promise.all([mutateSchedules(), mutateFallbackSchedules()])
            console.log('Data refresh completed')
          } catch (error) {
            console.error('Toggle enable failed:', error)
            toast(createErrorToast(error))
            throw error // Re-throw to let the component handle the optimistic update reversion
          }
        },
        onEdit: async (schedule: ScheduleResponseDto) => {
          setEditingSchedule(mapApiScheduleToEditingSchedule(schedule))
          setIsCreateModalOpen(true)
        }
      }),
    [mutateSchedules, mutateFallbackSchedules, toast],
  )

  const table = useReactTable({
    data: schedules,
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
      mutateSchedules()
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
      mutateSchedules()
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
        const column = table.getColumn('name')

        if (column) {
          column.setFilterValue(value)

          updateUrl(pathname, {
            search: value || null,
            page: '1', // Reset to first page when filter changes
          })

          // Force reload data when search changes
          mutateSchedules()
        }

        setIsPending(false)
      }, 500)
    },
    [table, updateUrl, pathname, mutateSchedules],
  )

  // Handle status filter change
  const handleStatusFilterChange = useCallback(
    (value: string) => {
      const statusColumn = table.getColumn('isEnabled')

      if (statusColumn) {
        const filterValue = value === 'all' ? '' : value
        statusColumn.setFilterValue(filterValue)

        updateUrl(pathname, {
          status: filterValue || null,
          page: '1', // Reset to page 1 when filter changes
        })

        mutateSchedules()
      }
    },
    [table, updateUrl, pathname, mutateSchedules],
  )

  // Handle recurrence type filter change
  const handleRecurrenceTypeFilterChange = useCallback(
    (value: string) => {
      const typeColumn = table.getColumn('recurrenceType')

      if (typeColumn) {
        const filterValue = value === 'all' ? '' : value
        typeColumn.setFilterValue(filterValue)

        updateUrl(pathname, {
          type: filterValue || null,
          page: '1', // Reset to page 1 when filter changes
        })

        mutateSchedules()
      }
    },
    [table, updateUrl, pathname, mutateSchedules],
  )

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimeout.current) clearTimeout(searchDebounceTimeout.current)
    }
  }, [])

  // Handle SWR errors
  useEffect(() => {
    if (schedulesError) {
      console.error('Failed to load schedules:', schedulesError)

      // Only show toast if fallback also failed
      if (!fallbackSchedules) {
        toast({
          title: 'Error',
          description: 'Failed to load schedules. Please try again.',
          variant: 'destructive',
        })
      }
    }
  }, [schedulesError, fallbackSchedules, toast])

  const handleCreateSuccess = useCallback(
    (newSchedule?: { id: string; name: string }) => {
      // ✅ Following React guideline: API calls in event handlers, not effects

      if (newSchedule) {
        // ✅ Optimistic update: immediately add the new schedule to the UI
        mutateSchedules((currentData) => {
          if (!currentData) return currentData

          // For OData response structure
          if ('value' in currentData && Array.isArray(currentData.value)) {
            const newScheduleDto: ScheduleResponseDto = {
              id: newSchedule.id,
              name: newSchedule.name,
              description: '',
              isEnabled: true,
              recurrenceType: RecurrenceType.Daily,
              timeZoneId: 'UTC',
              automationPackageId: '',
              botAgentId: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }

            return {
              ...currentData,
              value: [newScheduleDto, ...currentData.value],
              '@odata.count': (currentData['@odata.count'] || 0) + 1,
            }
          }

          return currentData
        }, false) // false = don't revalidate immediately
      }

      // ✅ Schedule debounced refresh to ensure we get the latest data from server
      setTimeout(() => {
        mutateSchedules()
      }, 2000) // 2 second delay to allow server processing
    },
    [mutateSchedules],
  )

  const handleCreateClick = () => {
    setEditingSchedule(null)
    setIsCreateModalOpen(true)
  }

  const handleRowClick = (row: ScheduleResponseDto) => {
    const isAdmin = pathname.startsWith('/admin')
    const route = isAdmin
      ? `/admin/schedules/${row.id}`
      : `/${tenant}/automation/schedule/${row.id}`
    router.push(route)
  }

  const handleModalClose = (shouldRefresh?: boolean) => {
    setIsCreateModalOpen(false)
    setEditingSchedule(null)
    if (shouldRefresh) {
      mutateSchedules()
    }
  }

  // Status filter options
  const statusOptions = [
    { value: 'enabled', label: 'Enabled' },
    { value: 'disabled', label: 'Disabled' },
  ]

  // Recurrence type filter options
  const recurrenceTypeOptions = Object.values(RecurrenceType).map((type) => ({
    value: type,
    label: getRecurrenceTypeDisplayName(type),
  }))

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Schedules</h2>
          <div className="flex items-center space-x-2">
            {totalCount > 0 && (
              <div className="text-sm text-muted-foreground">
                <span>
                  Total: {totalCount} schedule{totalCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            <Button onClick={handleCreateClick} className="flex items-center justify-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Schedule
            </Button>
          </div>
        </div>

        {schedulesError && !fallbackSchedules && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300">
              Failed to load schedules. Please try again.
            </p>
            <Button variant="outline" className="mt-2" onClick={() => mutateSchedules()}>
              Retry
            </Button>
          </div>
        )}

        <DataTableToolbar
          table={table}
          statuses={statusOptions}
          recurrenceTypes={recurrenceTypeOptions}
          onSearch={handleSearch}
          onStatusChange={handleStatusFilterChange}
          onRecurrenceTypeChange={handleRecurrenceTypeFilterChange}
          searchValue={searchValue}
          isFiltering={isDataLoading}
          isPending={isPending}
          searchPlaceholder="Search schedules by name..."
          totalCount={totalCount}
        />

        <DataTable
          data={schedules}
          columns={columns}
          onRowClick={handleRowClick}
          table={table}
          isLoading={isDataLoading}
          totalCount={totalCount}
        />

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
              mutateSchedules()
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
              mutateSchedules()
            }, 0)
          }}
        />

        {!isDataLoading && schedules.length === 0 && !schedulesError && (
          <div className="text-center py-10 text-muted-foreground">
            <p>No schedules found.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Schedule Modal */}
      <ScheduleModal
        key={editingSchedule?.id ?? 'new'}
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        mode={editingSchedule ? 'edit' : 'create'}
        editingSchedule={editingSchedule}
        onSuccess={handleCreateSuccess}
      />
    </>
  )
}
