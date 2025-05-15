'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns } from './columns'
import { DataTable } from '@/components/layout/table/data-table'
import { useState } from 'react'
import { CreateEditModal } from '@/components/agent/create-edit-modal'
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

export const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  status: z.string(),
  agent: z.string(),
  agentGroup: z.object({
    id: z.string(),
    name: z.string(),
  }),
  type: z.enum(['PRODUCTION', 'DEVELOPMENT', 'TESTING']),
  key: z.string(),
  machineName: z.string(),
  machineUsername: z.string(),
  description: z.string(),
  createdBy: z.string(),
})

export type AgentRow = z.infer<typeof agentSchema>

export default function AgentInterface() {
  const router = useRouter()
  const initialData: AgentRow[] = [
    {
      id: '1',
      name: 'Agent-001',
      version: '1.0.0',
      status: 'Active',
      agent: 'Agent-001',
      agentGroup: { id: '1', name: 'Production' },
      type: 'PRODUCTION',
      key: 'agent-001-key',
      machineName: 'PROD-SERVER-01',
      machineUsername: 'system_admin',
      description: 'Production server monitoring agent',
      createdBy: 'System',
    },
    {
      id: '2',
      name: 'Agent-002',
      version: '1.0.1',
      status: 'Active',
      agent: 'Agent-002',
      agentGroup: { id: '2', name: 'DEV' },
      type: 'DEVELOPMENT',
      key: 'agent-002-key',
      machineName: 'DEV-PC-01',
      machineUsername: 'dev_user',
      description: 'Development environment agent',
      createdBy: 'System',
    },
    {
      id: '3',
      name: 'Agent-003',
      version: '1.0.0',
      status: 'Inactive',
      agent: 'Agent-003',
      agentGroup: { id: '3', name: 'Test' },
      type: 'TESTING',
      key: 'agent-003-key',
      machineName: 'TEST-SERVER-01',
      machineUsername: 'test_user',
      description: 'Test environment agent',
      createdBy: 'System',
    },
    {
      id: '4',
      name: 'Agent-004',
      version: '1.0.2',
      status: 'Active',
      agent: 'Agent-004',
      agentGroup: { id: '4', name: 'PM' },
      type: 'PRODUCTION',
      key: 'agent-004-key',
      machineName: 'PROD-SERVER-02',
      machineUsername: 'system_admin',
      description: 'Backup server agent',
      createdBy: 'System',
    },
  ]

  const [data] = useState<AgentRow[]>(initialData)
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

  const handleRowClick = (row: AgentRow) => {
    const pathname = window.location.pathname
    const isAdmin = pathname.startsWith('/admin')
    const route = isAdmin ? `/admin/agent/${row.id}` : `/[tenant]/agent/${row.id}`
    router.push(route)
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
        </div>
        <DataTableToolbar
          table={table}
          agentGroups={[]}
          statuses={[
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
          ]}
        />
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
