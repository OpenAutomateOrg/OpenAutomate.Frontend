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
  ODataQueryOptions,
} from '@/lib/api/automation-packages'

export default function PackageInterface() {
  const router = useRouter()
  
  const [data, setData] = useState<AutomationPackageResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // Fetch packages data
  const fetchPackages = async (options?: ODataQueryOptions) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await getAutomationPackagesWithOData({
        $expand: 'Versions',
        $orderby: 'createdAt desc',
        ...options,
      })
      
      setData(response.value)
    } catch (err) {
      console.error('Error fetching packages:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch packages')
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchPackages()
  }, [])

  // Handle refresh after create/edit
  const handleRefresh = () => {
    fetchPackages()
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading packages...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Error loading packages: {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={() => fetchPackages()}
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
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
