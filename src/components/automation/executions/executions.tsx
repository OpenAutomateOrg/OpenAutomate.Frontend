'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns as HistoricalColumns } from './historical/columns'
import { columns as ProgressColumns } from './inProgress/columns'
import { columns as ScheduledColumns } from './scheduled/columns'
import { DataTable } from '@/components/layout/table/data-table'
import { useState, useEffect, useCallback } from 'react'
import CreateExecutionModal from './CreateExecutionModal'

import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { DataTableToolbar as HistoricalToolbar } from './historical/data-table-toolbar'
import { DataTableToolbar as ProgressToolbar } from './inProgress/data-table-toolbar'
import { DataTableToolbar as ScheduledToolbar } from './scheduled/data-table-toolbar'
import { useToast } from '@/components/ui/use-toast'
import { createErrorToast } from '@/lib/utils/error-utils'
import { getAllExecutions, ExecutionResponseDto } from '@/lib/api/executions'

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

export const executionsSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  value: z.string(),
  createdBy: z.string(),
  label: z.string(),
  status: z.string(),
  workflow: z.string().optional(),
  Version: z.string().optional(),
  Agent: z.string().optional(),
  'Agent Group': z.string().optional(),
  State: z.string().optional(),
  'Start Time': z.string().optional(),
  'End Time': z.string().optional(),
  Source: z.string().optional(),
  Command: z.string().optional(),
  Schedules: z.string().optional(),
  'Task Id': z.string().optional(),
  'Created Date': z.string().optional(),
  'Created By': z.string().optional(),
  agent: z.string().optional(),
  agentGroup: z.string().optional(),
  state: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  source: z.string().optional(),
  command: z.string().optional(),
  schedules: z.string().optional(),
  taskId: z.string().optional(),
  createdDate: z.string().optional(),
})

export type ExecutionsRow = z.infer<typeof executionsSchema>

export default function ExecutionsInterface() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [data, setData] = useState<ExecutionsRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [tab, setTab] = useState<'inprogress' | 'sheduled' | 'historical'>('inprogress')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // Use the columns from the historical columns as default
  // Dynamically select columns based on tab
  const columns =
    tab === 'inprogress'
      ? ProgressColumns
      : tab === 'sheduled'
        ? ScheduledColumns
        : HistoricalColumns

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

  const loadExecutions = useCallback(async () => {
    setIsLoading(true)
    try {
      const executions = await getAllExecutions()
      // Transform ExecutionResponseDto to ExecutionsRow format
      const transformedData = executions.map(execution => transformExecutionToRow(execution))
      setData(transformedData)
    } catch (error) {
      console.error('Error loading executions:', error)
      toast(createErrorToast(error))
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Load executions data on component mount
  useEffect(() => {
    loadExecutions()
  }, [loadExecutions])

  const transformExecutionToRow = (execution: ExecutionResponseDto): ExecutionsRow => {
    return {
      id: execution.id,
      workflow: execution.packageName || '',
      Version: execution.packageVersion || '',
      Agent: execution.botAgentName || '',
      'Agent Group': '', // Not available in current data model
      State: execution.status,
      'Start Time': execution.startTime ? new Date(execution.startTime).toLocaleString() : '',
      'End Time': execution.endTime ? new Date(execution.endTime).toLocaleString() : '',
      Source: 'Manual', // Assuming manual trigger for now
      Command: 'execute',
      Schedules: 'Once', // For immediate executions
      'Task Id': execution.id,
      'Created Date': execution.startTime ? new Date(execution.startTime).toLocaleDateString() : '',
      'Created By': 'Current User', // TODO: Get from auth context when available
      
      // Legacy fields for compatibility
      name: execution.packageName || '',
      type: 'execution',
      value: execution.packageVersion || '',
      createdBy: 'Current User',
      label: execution.botAgentName || '',
      status: execution.status,
      agent: execution.botAgentName || '',
      agentGroup: '',
      state: execution.status,
      startTime: execution.startTime ? new Date(execution.startTime).toLocaleString() : '',
      endTime: execution.endTime ? new Date(execution.endTime).toLocaleString() : '',
      source: 'Manual',
      command: 'execute',
      schedules: 'Once',
      taskId: execution.id,
      createdDate: execution.startTime ? new Date(execution.startTime).toLocaleDateString() : '',
    }
  }

  const handleCreateSuccess = () => {
    loadExecutions() // Refresh the data after successful execution creation
  }

  const handleCreateClick = () => {
    setIsCreateModalOpen(true)
  }

  const handleRowClick = (row: ExecutionsRow) => {
    const pathname = window.location.pathname
    const isAdmin = pathname.startsWith('/admin')
    const route = isAdmin ? `/admin/executions/${row.id}` : `/[tenant]/executions/${row.id}`
    router.push(route)
  }

  // Filter data based on current tab
  const getFilteredData = () => {
    switch (tab) {
      case 'inprogress':
        return data.filter((d) => d.state === 'Running' || d.state === 'Pending')
      case 'sheduled':
        return data.filter((d) => d.state === 'Scheduled')
      case 'historical':
        return data.filter((d) => d.state === 'Completed' || d.state === 'Failed' || d.state === 'Cancelled')
      default:
        return data
    }
  }

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        {/* Tabs */}
        <div className="mb-4 border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              className="px-3 py-2 font-medium text-sm border-b-2 border-transparent hover:border-primary hover:text-primary data-[active=true]:border-primary data-[active=true]:text-primary"
              data-active={tab === 'inprogress'}
              type="button"
              onClick={() => setTab('inprogress')}
            >
              In Progress
            </button>
            <button
              className="px-3 py-2 font-medium text-sm border-b-2 border-transparent hover:border-primary hover:text-primary data-[active=true]:border-primary data-[active=true]:text-primary"
              data-active={tab === 'sheduled'}
              type="button"
              onClick={() => setTab('sheduled')}
            >
              Scheduled
            </button>
            <button
              className="px-3 py-2 font-medium text-sm border-b-2 border-transparent hover:border-primary hover:text-primary data-[active=true]:border-primary data-[active=true]:text-primary"
              data-active={tab === 'historical'}
              type="button"
              onClick={() => setTab('historical')}
            >
              Historical
            </button>
          </nav>
        </div>

        {/* Create Button - Unified for all tabs */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleCreateClick}
            className="flex items-center justify-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Execution
          </Button>
        </div>

        {/* Tab Content */}
        {tab === 'inprogress' && (
          <>
            <ProgressToolbar
              table={table}
              statuses={[
                { value: 'Running', label: 'Running' },
                { value: 'Pending', label: 'Pending' },
              ]}
            />
            <DataTable
              data={getFilteredData()}
              columns={ProgressColumns}
              onRowClick={handleRowClick}
              table={table}
              isLoading={isLoading}
            />
          </>
        )}
        {tab === 'sheduled' && (
          <>
            <ScheduledToolbar
              table={table}
              statuses={[{ value: 'Scheduled', label: 'Scheduled' }]}
            />
            <DataTable
              data={getFilteredData()}
              columns={ScheduledColumns}
              onRowClick={handleRowClick}
              table={table}
              isLoading={isLoading}
            />
          </>
        )}
        {tab === 'historical' && (
          <>
            <HistoricalToolbar
              table={table}
              statuses={[
                { value: 'Completed', label: 'Completed' },
                { value: 'Failed', label: 'Failed' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
            />
            <DataTable
              data={getFilteredData()}
              columns={HistoricalColumns}
              onRowClick={handleRowClick}
              table={table}
              isLoading={isLoading}
            />
          </>
        )}
      </div>
      
      {/* Unified Create Execution Modal */}
      <CreateExecutionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  )
} 