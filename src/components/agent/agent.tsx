'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns } from './columns'
import { DataTable } from '@/components/layout/table/data-table'
import { useState, useEffect } from 'react'
import { CreateEditModal } from '@/components/agent/create-edit-modal'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { DataTableToolbar } from './data-table-toolbar'
import { agentApi } from '@/lib/api/agent'
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
  machineName: z.string(),
  machineKey: z.string(),
  status: z.string(),
  lastConnected: z.string().nullable().optional(),
  isActive: z.boolean(),
})

export type AgentRow = z.infer<typeof agentSchema>

export default function AgentInterface() {
  const router = useRouter()
  const [data, setData] = useState<AgentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // Fetch agent data
  const fetchAgents = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const agents = await agentApi.getAll()
      // Convert API response to AgentRow type
      const formattedAgents: AgentRow[] = agents.map(agent => ({
        ...agent,
        lastConnected: agent.lastConnected || null
      }))
      setData(formattedAgents)
    } catch (err: unknown) {
      console.error('Error fetching agents:', err)
      let errorMessage = 'Failed to load agents';
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        errorMessage = err.message;
      }
      setError(errorMessage)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch agents on component mount
  useEffect(() => {
    fetchAgents()
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

  const handleRowClick = (row: AgentRow) => {
    const pathname = window.location.pathname
    const isAdmin = pathname.startsWith('/admin')
    const route = isAdmin ? `/admin/agent/${row.id}` : `/[tenant]/agent/${row.id}`
    router.push(route)
  }

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <div className="flex items-center justify-between">
          <div>
            {error && <div className="text-red-500">{error}</div>}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setModalMode('create')
                setIsModalOpen(true)
              }}
              className="flex items-center justify-center"
              disabled={isLoading}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create
            </Button>
          </div>
        </div>
        <DataTableToolbar
          table={table}
          statuses={[
            { value: 'Online', label: 'Online' },
            { value: 'Offline', label: 'Offline' },
          ]}
        />
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            Loading agents...
          </div>
        ) : (
          <DataTable 
            data={data} 
            columns={columns} 
            onRowClick={handleRowClick} 
            table={table}
          />
        )}
      </div>
      <CreateEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
        }}
        mode={modalMode}
        onSuccess={fetchAgents}
      />
    </>
  )
}
