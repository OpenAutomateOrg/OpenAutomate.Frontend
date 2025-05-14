'use client'

import React, { useState, useEffect } from 'react'
import { PlusCircle, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns } from './columns'
import { DataTable } from '@/components/layout/table/data-table'
import { CreateEditModal } from '@/components/asset/create-edit-modal'
import { z } from 'zod'
import { useRouter, useParams } from 'next/navigation'
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
} from '@tanstack/react-table'
import { api } from '@/lib/api/client'

export const assetSchema = z.object({
  id: z.string(),
  key: z.string(),
  type: z.string(),
  description: z.string(),
  createdBy: z.string(),
  label: z.string(),
  status: z.string(),
})

export type AssetRow = z.infer<typeof assetSchema>

export default function AssetInterface() {
  const router = useRouter()


  const params = useParams()
  const tenant = params?.tenant as string
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  useEffect(() => {
    if (!tenant) return
    setLoading(true)
    setError(null)
    api.get<any[]>(`${tenant}/api/assets`)
      .then(setData)
      .catch((err) => {
        setError(
          typeof err === 'object' && err !== null && 'message' in err
            ? (err as any).message
            : 'Failed to fetch assets',
        )
      })
      .finally(() => setLoading(false))
  }, [tenant])

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

  const handleRowClick = (row: AssetRow) => {
    const pathname = window.location.pathname
    const isAdmin = pathname.startsWith('/admin')
    const route = isAdmin ? `/admin/asset/${row.id}` : `/[tenant]/asset/${row.id}`
    router.push(route)
  }

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import clicked')
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export clicked')
  }

  const handleCreateAsset = () => {
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleAssetCreated = () => {
    setLoading(true)
    setError(null)
    api.get<any[]>(`${tenant}/api/assets`)
      .then(setData)
      .catch((err) => {
        setError(
          typeof err === 'object' && err !== null && 'message' in err
            ? (err as any).message
            : 'Failed to fetch assets',
        )
      })
      .finally(() => setLoading(false))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40">Loading assets...</div>
  }
  if (error) {
    return <div className="flex items-center justify-center h-40 text-red-500">{error}</div>
  }

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleCreateAsset}
            className="flex items-center justify-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create
          </Button>
          <Button
            variant="outline"
            onClick={handleImport}
            className="flex items-center justify-center"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center justify-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        <DataTableToolbar table={table} />
        <DataTable data={data} columns={columns} onRowClick={handleRowClick} table={table} />
      </div>
      <CreateEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        onCreated={handleAssetCreated}
        existingKeys={data.map((item) => item.key)}
      />
    </>
  )
}
