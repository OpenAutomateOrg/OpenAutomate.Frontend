'use client'

import { PlusCircle, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns } from './columns'
import { DataTable } from '@/components/layout/table/data-table'
import { useState } from 'react'
import { CreateEditModal } from '@/components/asset/create-edit-modal'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
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

export const assetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  value: z.string(),
  createdBy: z.string(),
  label: z.string(),
  status: z.string(),
})

export type AssetRow = z.infer<typeof assetSchema>

export default function AssetInterface() {
  const router = useRouter()
  const initialData: AssetRow[] = [
    {
      id: '1',
      name: 'bot',
      type: 'Hardware',
      value: '$1,299',
      createdBy: 'John Doe',
      label: 'IT Equipment',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Microsoft Office License',
      type: 'Software',
      value: '$149',
      createdBy: 'Jane Smith',
      label: 'Software License',
      status: 'Active',
    },
    {
      id: '3',
      name: 'Office Chair',
      type: 'Furniture',
      value: '$299',
      createdBy: 'Mike Johnson',
      label: 'Office Furniture',
      status: 'Inactive',
    },
    {
      id: '4',
      name: 'Adobe Creative Cloud',
      type: 'Software',
      value: '$599/year',
      createdBy: 'Sarah Wilson',
      label: 'Design Software',
      status: 'Active',
    },
    {
      id: '5',
      name: 'Network Printer',
      type: 'Hardware',
      value: '$899',
      createdBy: 'David Brown',
      label: 'IT Equipment',
      status: 'Active',
    },
  ]

  const [data] = useState<AssetRow[]>(initialData)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

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

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <div className="flex justify-end gap-2">
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
        onClose={() => {
          setIsModalOpen(false)
        }}
        mode={modalMode}
      />
    </>
  )
}
