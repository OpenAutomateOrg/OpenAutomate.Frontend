'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns } from './columns'

import { DataTable } from '@/components/layout/table/data-table'
import { useState, useEffect } from 'react'
import { CreateEditModal } from './create-edit-modal'

import { useRouter } from 'next/navigation'
import { DataTableToolbar } from './data-table-toolbar'
import { organizationUnitApi } from '@/lib/api/organization-units'
import type { OrganizationUnit } from '@/types/organization'

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

export default function OrganizationUnitAdminInterface() {
  const router = useRouter()
  const [data, setData] = useState<OrganizationUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // Fetch organization units on component mount
  useEffect(() => {
    const fetchOrganizationUnits = async () => {
      try {
        setLoading(true)
        setError(null)
        const organizationUnits = await organizationUnitApi.getAllOrganizationUnits()
        setData(organizationUnits)
      } catch (err) {
        setError('Failed to fetch organization units')
        console.error('Error fetching organization units:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizationUnits()
  }, [])

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

  const handleRowClick = (row: OrganizationUnit) => {
    const pathname = window.location.pathname
    const isSystemAdmin = pathname.startsWith('/system-admin')
    const route = isSystemAdmin
      ? `/system-admin/organizationUnit/${row.id}`
      : `/[tenant]/organizationUnit/${row.id}`
    router.push(route)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading organization units...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
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
            statuses={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
          />
          <DataTable data={data} columns={columns} onRowClick={handleRowClick} table={table} />
        </>
      </div>
      <CreateEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
        }}
      />
    </>
  )
}
