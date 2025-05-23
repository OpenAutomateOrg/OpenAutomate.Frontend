'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns as HistoricalColumns } from './historical/columns'
import { columns as ProgressColumns } from './inProgress/columns'
import { columns as ScheduledColumns } from './scheduled/columns'
import { DataTable } from '@/components/layout/table/data-table'
import { useState } from 'react'
import { CreateEditModal as HistoricalModal } from './historical/create-edit-modal'
import { CreateEditModal as ProgressModal } from './inProgress/create-edit-modal'
import { CreateEditModal as ScheduledModal } from './scheduled/create-edit-modal'

import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { DataTableToolbar as HistoricalToolbar } from './historical/data-table-toolbar'
import { DataTableToolbar as ProgressToolbar } from './inProgress/data-table-toolbar'
import { DataTableToolbar as ScheduledToolbar } from './scheduled/data-table-toolbar'

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

export const excutionsSchema = z.object({
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

export type ExcutionsRow = z.infer<typeof excutionsSchema>

export default function ExcutionsInterface() {
  const router = useRouter()
  const initialData: ExcutionsRow[] = [
    {
      id: '1',
      workflow: 'Daily Backup',
      Version: 'v1.0',
      Agent: 'Agent1',
      'Agent Group': '',
      State: 'Running',
      'Start Time': '2024-06-01 08:00',
      'End Time': '2024-06-01 09:00',
      Source: 'System',
      Command: 'backup.sh',
      Schedules: 'Daily',
      'Task Id': 'T001',
      'Created Date': '2024-06-01',
      'Created By': 'Alice Nguyen',
      // legacy fields for compatibility
      name: 'Daily Backup',
      type: 'workflow',
      value: 'v1.0',
      createdBy: 'Alice Nguyen',
      label: 'Agent1',
      status: 'Running',
      agent: 'Agent1',
      agentGroup: '',
      state: 'Running',
      startTime: '2024-06-01 08:00',
      endTime: '2024-06-01 09:00',
      source: 'System',
      command: 'backup.sh',
      schedules: 'Daily',
      taskId: 'T001',
      createdDate: '2024-06-01',
    },
    {
      id: '2',
      workflow: 'Data Sync',
      Version: 'v2.1',
      Agent: 'Agent2',
      'Agent Group': '',
      State: 'Completed',
      'Start Time': '2024-06-02 10:00',
      'End Time': '2024-06-02 10:30',
      Source: 'API',
      Command: 'sync.sh',
      Schedules: 'Weekly',
      'Task Id': 'T002',
      'Created Date': '2024-06-02',
      'Created By': 'Bob Tran',
      name: 'Data Sync',
      type: 'workflow',
      value: 'v2.1',
      createdBy: 'Bob Tran',
      label: '',
      status: 'Completed',
      agent: 'Agent2',
      agentGroup: '',
      state: 'Completed',
      startTime: '2024-06-02 10:00',
      endTime: '2024-06-02 10:30',
      source: 'API',
      command: 'sync.sh',
      schedules: 'Weekly',
      taskId: 'T002',
      createdDate: '2024-06-02',
    },
    {
      id: '3',
      workflow: 'Report Generation',
      Version: 'v1.2',
      Agent: '',
      'Agent Group': 'Agent Group A',
      State: 'Failed',
      'Start Time': '2024-06-03 07:00',
      'End Time': '2024-06-03 07:15',
      Source: 'User',
      Command: 'report.sh',
      Schedules: 'Monthly',
      'Task Id': 'T003',
      'Created Date': '2024-06-03',
      'Created By': 'Charlie Le',
      name: 'Report Generation',
      type: 'workflow',
      value: 'v1.2',
      createdBy: 'Charlie Le',
      label: '',
      status: 'Failed',
      agent: '',
      agentGroup: 'Agent Group A',
      state: 'Failed',
      startTime: '2024-06-03 07:00',
      endTime: '2024-06-03 07:15',
      source: 'User',
      command: 'report.sh',
      schedules: 'Monthly',
      taskId: 'T003',
      createdDate: '2024-06-03',
    },
    {
      id: '4',
      workflow: 'User Import',
      Version: 'v3.0',
      Agent: 'Agent3',
      'Agent Group': '',
      State: 'Scheduled',
      'Start Time': '2024-06-04 12:00',
      'End Time': '',
      Source: 'CSV',
      Command: 'import.sh',
      Schedules: 'Once',
      'Task Id': 'T004',
      'Created Date': '2024-06-04',
      'Created By': 'Diana Pham',
      name: 'User Import',
      type: 'workflow',
      value: 'v3.0',
      createdBy: 'Diana Pham',
      label: 'Agent3',
      status: 'Scheduled',
      agent: 'Agent3',
      agentGroup: '',
      state: 'Scheduled',
      startTime: '2024-06-04 12:00',
      endTime: '',
      source: 'CSV',
      command: 'import.sh',
      schedules: 'Once',
      taskId: 'T004',
      createdDate: '2024-06-04',
    },
    {
      id: '5',
      workflow: 'System Cleanup',
      Version: 'v2.0',
      Agent: '',
      'Agent Group': 'Agent Group B',
      State: 'Running',
      'Start Time': '2024-06-05 03:00',
      'End Time': '',
      Source: 'System',
      Command: 'cleanup.sh',
      Schedules: 'Weekly',
      'Task Id': 'T005',
      'Created Date': '2024-06-05',
      'Created By': 'Evan Vo',
      name: 'System Cleanup',
      type: 'workflow',
      value: 'v2.0',
      createdBy: 'Evan Vo',
      label: '',
      status: 'Running',
      agent: '',
      agentGroup: 'Agent Group B',
      state: 'Running',
      startTime: '2024-06-05 03:00',
      endTime: '',
      source: 'System',
      command: 'cleanup.sh',
      schedules: 'Weekly',
      taskId: 'T005',
      createdDate: '2024-06-05',
    },
  ]

  const [data] = useState<ExcutionsRow[]>(initialData)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
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

  const handleRowClick = (row: ExcutionsRow) => {
    const pathname = window.location.pathname
    const isAdmin = pathname.startsWith('/admin')
    const route = isAdmin ? `/admin/excutions/${row.id}` : `/[tenant]/excutions/${row.id}`
    router.push(route)
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
              Sheduled
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
        {/* Tab Content */}
        {tab === 'inprogress' && (
          <>
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
            <ProgressToolbar
              table={table}
              statuses={[
                { value: 'Running', label: 'Running' },
                { value: 'Scheduled', label: 'Scheduled' },
              ]}
            />
            <DataTable
              data={data.filter((d) => d.state === 'Running')}
              columns={ProgressColumns}
              onRowClick={handleRowClick}
              table={table}
            />
          </>
        )}
        {tab === 'sheduled' && (
          <>
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
            <ScheduledToolbar
              table={table}
              statuses={[{ value: 'Scheduled', label: 'Scheduled' }]}
            />
            <DataTable
              data={data.filter((d) => d.state === 'Scheduled')}
              columns={ScheduledColumns}
              onRowClick={handleRowClick}
              table={table}
            />
          </>
        )}
        {tab === 'historical' && (
          <>
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
            <HistoricalToolbar
              table={table}
              statuses={[
                { value: 'Completed', label: 'Completed' },
                { value: 'Failed', label: 'Failed' },
              ]}
            />
            <DataTable
              data={data.filter((d) => d.state === 'Completed' || d.state === 'Failed')}
              columns={HistoricalColumns}
              onRowClick={handleRowClick}
              table={table}
            />
          </>
        )}
      </div>
      {tab === 'historical' && (
        <HistoricalModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
          }}
          mode={modalMode}
        />
      )}
      {tab === 'inprogress' && (
        <ProgressModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
          }}
          mode={modalMode}
        />
      )}
      {tab === 'sheduled' && (
        <ScheduledModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
          }}
          mode={modalMode}
        />
      )}
    </>
  )
}
