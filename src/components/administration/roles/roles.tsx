'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRolesColumns } from './columns'
import { DataTable } from '@/components/layout/table/data-table'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { CreateEditModal } from './create-edit-modal'
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
import { rolesApi } from '@/lib/api/roles'
import { useUrlParams } from '@/hooks/use-url-params'
import { Pagination } from '@/components/ui/pagination'
import useSWR from 'swr'
import { swrKeys } from '@/lib/config/swr-config'
import { useToast } from '@/components/ui/use-toast'
import { useLocale } from '@/providers/locale-provider'

export const rolesSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isSystemAuthority: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
})

export type RolesRow = z.infer<typeof rolesSchema> & {
  permissions?: {
    resourceName: string
    permission: number
  }[]
}

export default function RolesInterface() {
  const { t } = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { updateUrl } = useUrlParams()
  const { toast } = useToast()

  // UI State management
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RolesRow | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [totalCount, setTotalCount] = useState<number>(0)
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

  // ✅ SWR for roles data - following guideline #8: use framework-level loaders
  const {
    data: roles,
    error: rolesError,
    isLoading,
    mutate: mutateRoles,
  } = useSWR(swrKeys.roles(), rolesApi.getAllRoles)

  // ✅ Transform data during render (following guideline #1: prefer deriving data during render)
  const rolesData = useMemo(() => {
    if (!roles) return []

    // Transform backend data to match our schema
    let transformedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystemAuthority: role.isSystemAuthority,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions?.map((p) => ({
        resourceName: p.resourceName,
        permission: p.permission,
      })),
    }))

    // Apply client-side filtering for search
    if (columnFilters.length > 0) {
      const nameFilter = columnFilters.find((filter) => filter.id === 'name')
      if (nameFilter && nameFilter.value) {
        const searchTerm = (nameFilter.value as string).toLowerCase()
        transformedRoles = transformedRoles.filter(
          (role) =>
            role.name.toLowerCase().includes(searchTerm) ||
            role.description.toLowerCase().includes(searchTerm),
        )
      }
    }

    // Apply client-side sorting
    if (sorting.length > 0) {
      const sort = sorting[0]
      transformedRoles.sort((a, b) => {
        const aValue = a[sort.id as keyof typeof a]
        const bValue = b[sort.id as keyof typeof b]

        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0
        if (aValue === undefined) return sort.desc ? 1 : -1
        if (bValue === undefined) return sort.desc ? -1 : 1

        if (aValue < bValue) return sort.desc ? 1 : -1
        if (aValue > bValue) return sort.desc ? -1 : 1
        return 0
      })
    }

    return transformedRoles
  }, [roles, columnFilters, sorting])

  // ✅ Handle SWR errors (following guideline #3: error handling in dedicated effects)
  // Client-only: Requires toast notifications for user feedback
  useEffect(() => {
    if (rolesError) {
      console.error('Failed to load roles:', rolesError)
      toast({
        title: 'Error',
        description: 'Failed to load roles. Please try again.',
        variant: 'destructive',
      })
    }
  }, [rolesError, toast])

  // ✅ Update total count when data changes (following guideline #1: derive data during render)
  useEffect(() => {
    if (rolesData) {
      setTotalCount(rolesData.length)
    }
  }, [rolesData])

  // ✅ Refresh handler using SWR mutate (following guideline #8: use framework-level loaders)
  const refreshRoles = useCallback(async () => {
    setIsPending(false)
    setIsChangingPageSize(false)
    await mutateRoles()
  }, [mutateRoles])

  // Get columns with refresh handler
  const columns = useRolesColumns({ onRefresh: refreshRoles })

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

  // Calculate page count
  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / pagination.pageSize))
  }, [totalCount, pagination.pageSize])

  // Setup table instance
  const table = useReactTable({
    data: rolesData,
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
    getRowId: (row) => row.id,
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

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimeout.current) clearTimeout(searchDebounceTimeout.current)
    }
  }, [])

  // ✅ Simple handlers using SWR mutate (following guideline #8: use framework-level loaders)
  const handleRoleCreated = () => mutateRoles()

  const handleRowClick = (row: RolesRow) => {
    router.push(`roles/${row.id}`)
  }

  const handleCreateRole = () => {
    setEditingRole(null)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('administration.roles.title')}</h2>
            <p className="text-muted-foreground">
              Manage user roles and permissions within your organization.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleCreateRole} className="flex items-center justify-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('administration.roles.createRole')}
            </Button>
          </div>
        </div>

        {rolesError && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300">
              Failed to load roles. Please try again.
            </p>
            <Button variant="outline" className="mt-2" onClick={() => mutateRoles()}>
              Retry
            </Button>
          </div>
        )}

        <DataTableToolbar
          table={table}
          onSearch={handleSearch}
          searchValue={searchValue}
          isFiltering={isLoading}
          isPending={isPending}
        />

        <DataTable
          data={rolesData}
          columns={columns}
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
          }}
        />
      </div>

      <CreateEditModal
        key={editingRole?.id ?? 'new'} // Dynamic key to reset component state
        isOpen={isModalOpen}
        onClose={(shouldReload) => {
          setIsModalOpen(false)
          setEditingRole(null)
          if (shouldReload) {
            handleRoleCreated()
          }
        }}
        editingRole={editingRole}
      />
    </>
  )
}
