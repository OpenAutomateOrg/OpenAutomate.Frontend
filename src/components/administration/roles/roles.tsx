'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useMemo, useRef } from 'react'
import { CreateEditModal } from './create-edit-modal'
import { useRouter } from 'next/navigation'
import { rolesApi } from '@/lib/api/roles'
import { useToast } from '@/components/ui/use-toast'
import { DataTable } from '@/components/layout/table/data-table'
import { columns } from './columns'
import { RolesDataTableToolbar } from './data-table-toolbar'
import { Pagination } from '@/components/ui/pagination'
import type { ColumnDef, Row } from '@tanstack/react-table'
import DataTableRowAction from './data-table-row-actions'
import useSWR from 'swr'

export interface RolesRow {
  id: string
  name: string
  description: string
  isSystemAuthority: boolean
  createdAt: string
  updatedAt?: string
  permissions?: {
    resourceName: string
    permission: number
  }[]
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function RolesInterface() {
  const router = useRouter()
  const { toast } = useToast()

  // ✅ Filter state management (following useEffect compliance guide)
  const [searchName, setSearchName] = useState('')
  const [searchDescription, setSearchDescription] = useState('')
  const [searchResource, setSearchResource] = useState('')
  const [filterSystemRoles, setFilterSystemRoles] = useState<string>('ALL')

  // ✅ UI state management
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RolesRow | null>(null)

  // ✅ Pagination state
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Refs for tracking total count
  const totalCountRef = useRef<number>(0)
  const [hasExactCount, setHasExactCount] = useState(false)

  // ✅ Debounced filter values (following guideline #1: prefer deriving data during render)
  const debouncedName = useDebounce(searchName, 400)
  const debouncedDescription = useDebounce(searchDescription, 400)
  const debouncedResource = useDebounce(searchResource, 400)

  // ✅ Get available resources for filtering options
  const { data: availableResources } = useSWR('available-resources', rolesApi.getAvailableResources)

  const resourceOptions = useMemo(() => {
    if (!availableResources) return []
    return [...new Set(availableResources.map((r) => r.resourceName))]
  }, [availableResources])

  // ✅ Build OData options for SWR key
  const odataOptions = {
    $filter:
      [
        debouncedName ? `contains(tolower(name),'${debouncedName.toLowerCase()}')` : undefined,
        debouncedDescription
          ? `contains(tolower(description),'${debouncedDescription.toLowerCase()}')`
          : undefined,
        debouncedResource
          ? `permissions/any(p: contains(tolower(p/resourceName),'${debouncedResource.toLowerCase()}'))`
          : undefined,
        filterSystemRoles !== 'ALL'
          ? `isSystemAuthority eq ${filterSystemRoles === 'SYSTEM' ? 'true' : 'false'}`
          : undefined,
      ]
        .filter(Boolean)
        .join(' and ') || undefined,
    $top: pageSize,
    $skip: pageIndex * pageSize,
    $count: true,
  }

  // ✅ SWR for roles data (following guideline #8: use framework-level loaders)
  const {
    data: rolesResponse,
    error,
    isLoading,
    mutate,
  } = useSWR(['roles-with-odata', odataOptions], () => rolesApi.getRolesWithOData(odataOptions), {
    keepPreviousData: true,
  })

  const roles = rolesResponse?.value ?? []
  const totalCount = rolesResponse?.['@odata.count'] ?? roles.length

  // ✅ Update total count based on OData response (following guideline #2: no setState-only effects)
  useEffect(() => {
    if (rolesResponse) {
      if (typeof rolesResponse['@odata.count'] === 'number') {
        totalCountRef.current = rolesResponse['@odata.count']
        setHasExactCount(true)
      } else {
        // If no @odata.count, use length as minimum count
        const minCount = pageIndex * pageSize + roles.length
        if (minCount > totalCountRef.current) {
          totalCountRef.current = minCount
        }

        // If we have a full page and we're on the first page, assume there's at least one more
        const isFullFirstPage = roles.length === pageSize && pageIndex === 0
        if (isFullFirstPage) {
          totalCountRef.current = minCount + 1
        }

        setHasExactCount(false)
      }
    }
  }, [rolesResponse, pageIndex, pageSize, roles.length])

  // ✅ Calculate page count with better edge case handling (following guideline #1: derive during render)
  const totalPages = useMemo(() => {
    const calculatedCount = Math.max(1, Math.ceil(totalCount / pageSize))
    const hasMorePages = roles.length === pageSize && totalCount <= pageSize * (pageIndex + 1)
    const minValidPageCount = pageIndex + 1

    if (hasMorePages) {
      return Math.max(minValidPageCount, calculatedCount, pageIndex + 2)
    }
    return Math.max(minValidPageCount, calculatedCount)
  }, [totalCount, pageSize, pageIndex, roles.length])

  const isUnknownTotalCount = !hasExactCount && roles.length === pageSize

  // ✅ Handle SWR errors (following guideline #3: error handling in dedicated effects)
  useEffect(() => {
    if (error) {
      console.error('Failed to load roles:', error)
      toast({
        title: 'Error',
        description: 'Failed to load roles. Please try again.',
        variant: 'destructive',
      })
    }
  }, [error, toast])

  // ✅ Map API role to table row (following guideline #1: derive during render)
  function mapRoleToRolesRow(role: any): RolesRow {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystemAuthority: role.isSystemAuthority,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions?.map((p: any) => ({
        resourceName: p.resourceName,
        permission: p.permission,
      })),
    }
  }

  // ✅ Event handlers for user actions (following guideline #3)
  const handleRowClick = (row: RolesRow) => {
    router.push(`roles/${row.id}`)
  }

  const handleCreateRole = () => {
    setEditingRole(null)
    setIsCreateModalOpen(true)
  }

  const handleEditRole = (role: RolesRow) => {
    setEditingRole(role)
    setIsCreateModalOpen(true)
  }

  const handleDeleteRole = async (roleId: string) => {
    try {
      await rolesApi.deleteRole(roleId)
      toast({
        title: 'Success',
        description: 'Role deleted successfully.',
      })
      await mutate() // ✅ Refresh cache
    } catch (error) {
      console.error('Failed to delete role:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete role. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleModalClose = async (shouldReload = false) => {
    setIsCreateModalOpen(false)
    setEditingRole(null)

    if (shouldReload) {
      await mutate()
    }
  }

  const handleResetFilters = () => {
    setSearchName('')
    setSearchDescription('')
    setSearchResource('')
    setFilterSystemRoles('ALL')
  }

  // ✅ Fix for TypeScript warning about row prop
  const columnsWithAction: ColumnDef<RolesRow>[] = columns.map((col) =>
    col.id === 'actions'
      ? {
          ...col,
          cell: ({ row }: { row: Row<RolesRow> }) => (
            <DataTableRowAction row={row} onEdit={handleEditRole} onDelete={handleDeleteRole} />
          ),
        }
      : col,
  )

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles Management</h2>
          <p className="text-muted-foreground">
            Manage user roles and permissions within your organization.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {totalCount > 0 && (
            <div className="text-sm text-muted-foreground">
              <span>
                Total: {totalCount} role{totalCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <Button onClick={handleCreateRole} className="h-8 px-2 lg:px-3">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <RolesDataTableToolbar
          searchName={searchName}
          setSearchName={setSearchName}
          searchDescription={searchDescription}
          setSearchDescription={setSearchDescription}
          searchResource={searchResource}
          filterSystemRoles={filterSystemRoles}
          setFilterSystemRoles={setFilterSystemRoles}
          loading={isLoading}
          onReset={handleResetFilters}
        />

        <DataTable
          columns={columnsWithAction}
          data={roles.map(mapRoleToRolesRow)}
          isLoading={isLoading}
          totalCount={totalCount}
          onRowClick={handleRowClick}
        />

        <Pagination
          currentPage={pageIndex + 1}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          isUnknownTotalCount={isUnknownTotalCount}
          onPageChange={(page) => setPageIndex(page - 1)}
          onPageSizeChange={setPageSize}
        />

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300">Failed to load roles</p>
            <Button variant="outline" className="mt-2" onClick={() => mutate()}>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && roles.length === 0 && !error && (
          <div className="text-center py-10 text-muted-foreground">
            <p>No roles found.</p>
          </div>
        )}
      </div>

      <CreateEditModal
        key={editingRole?.id ?? 'new'} // ✅ Dynamic key to reset component state
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        editingRole={editingRole}
      />
    </div>
  )
}
