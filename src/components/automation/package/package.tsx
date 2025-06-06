'use client'

import { PlusCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns } from './columns'
import { DataTable } from '@/components/layout/table/data-table'
import { useState, useEffect } from 'react'
import { CreateEditModal } from './create-edit-modal'
import { useRouter } from 'next/navigation'
import { DataTableToolbar } from './data-table-toolbar'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
} from '@tanstack/react-table'
import {
  AutomationPackageResponseDto,
  getAutomationPackagesWithOData,
} from '@/lib/api/automation-packages'
import useSWR from 'swr'
import { swrKeys, createSWRErrorMessage } from '@/lib/swr-config'
import { useToast } from '@/components/ui/use-toast'

export default function PackageInterface() {
  const router = useRouter()
  const { toast } = useToast()

  // ✅ SWR for data fetching - following guideline #8: use framework-level loaders
  const { data: packages, error, isLoading, mutate } = useSWR(
    swrKeys.packagesWithOData({
      $expand: 'Versions',
      $orderby: 'createdAt desc',
    }),
    () => getAutomationPackagesWithOData({
      $expand: 'Versions',
      $orderby: 'createdAt desc',
    })
  )

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // ✅ Transform data during render (guideline #1) - derive data during render
  const data = packages?.value ?? []

  // ✅ Error handling in dedicated effect (guideline #3)
  // Client-only: Requires toast notifications for user feedback
  useEffect(() => {
    if (error) {
      console.error('Failed to load packages:', error)
      toast({
        title: 'Error',
        description: createSWRErrorMessage(error),
        variant: 'destructive',
      })
    }
  }, [error, toast])

  // Handle refresh after create/edit
  const handleRefresh = () => {
    mutate() // ✅ Use SWR's mutate for cache invalidation
  }

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const handleRowClick = (row: AutomationPackageResponseDto) => {
    const pathname = window.location.pathname
    const tenantMatch = pathname.match(/^\/([^\/]+)/)
    const tenant = tenantMatch ? tenantMatch[1] : 'default'
    const route = `/${tenant}/automation/package/${row.id}`
    router.push(route)
  }

  const statusOptions = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ]

  // ✅ Loading state handling
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading packages...</span>
        </div>
      </div>
    )
  }

  // ✅ Error state handling - note: errors are also handled via toast in useEffect
  if (error && !data.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Error loading packages: {createSWRErrorMessage(error)}
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => mutate()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
        
        <DataTableToolbar
          table={table}
          statuses={statusOptions}
        />
        
        <DataTable
          data={data}
          columns={columns}
          onRowClick={handleRowClick}
          table={table}
        />
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
