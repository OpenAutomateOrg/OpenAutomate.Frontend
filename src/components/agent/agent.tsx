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
import { useAgentApi, AgentResponse } from '@/lib/api/agent'

export const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  machineName: z.string(),
  status: z.string(),
  lastConnected: z.string().optional(),
  isActive: z.boolean().optional(),
})

export type AgentRow = z.infer<typeof agentSchema>

// Fallback data in case API fails
const fallbackData: AgentRow[] = [
  {
    id: '1',
    name: 'Agent-001',
    status: 'Active',
    machineName: 'MACHINE-001',
    lastConnected: '2023-08-15 09:30:45',
    isActive: true,
  },
  {
    id: '2',
    name: 'Agent-002',
    status: 'Inactive',
    machineName: 'MACHINE-002',
    lastConnected: 'Never',
    isActive: false,
  },
]

export default function AgentInterface() {
  const router = useRouter()
  const agentApi = useAgentApi()
  
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<AgentRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // Load agents from the API
  const loadAgents = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      try {
        const agents = await agentApi.getAll()
        
        // Transform API response to match the table schema
        const transformedAgents = agents.map(agent => ({
          id: agent.id,
          name: agent.name,
          status: agent.status,
          machineName: agent.machineName,
          lastConnected: agent.lastConnected ? new Date(agent.lastConnected).toLocaleString() : 'Never',
          isActive: agent.isActive,
        }))
        
        if (transformedAgents.length === 0) {
          // If no data returned, use fallback data
          setData(fallbackData)
        } else {
          setData(transformedAgents)
        }
      } catch (apiError) {
        console.error("Error loading agents from API:", apiError)
        // Use fallback data if API fails
        setData(fallbackData)
        setError("Couldn't load agents from the server. Showing example data instead.")
      }
    } catch (error) {
      console.error("Error loading agents:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Load agents on component mount
  useEffect(() => {
    loadAgents()
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
    const route = isAdmin ? `/admin/agent/${row.id}` : `/${pathname.split('/')[1]}/agent/${row.id}`
    router.push(route)
  }

  return (
    <>
      <div className="flex flex-col space-y-4 p-4">
        {error && (
          <div className="bg-yellow-50 p-3 text-yellow-800 rounded mb-4">
            {error}
          </div>
        )}
        
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
          statuses={[
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
          ]}
        />
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            <span className="ml-2">Loading agents...</span>
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
        onSuccess={loadAgents}
      />
    </>
  )
}
