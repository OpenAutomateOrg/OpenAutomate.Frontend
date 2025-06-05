'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { CreateEditModal } from './create-edit-modal'
import { useRouter } from 'next/navigation'
import { rolesApi, type RoleWithPermissionsDto } from '@/lib/api/roles'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

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

export default function RolesInterface() {
  const router = useRouter()
  const { toast } = useToast()
  
  // State management
  const [data, setData] = useState<RolesRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RolesRow | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Load roles data
  const loadRoles = async () => {
    try {
      setLoading(true)
      const roles = await rolesApi.getAllRoles()
      
      // Transform backend data to match our schema
      const transformedRoles: RolesRow[] = roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystemAuthority: role.isSystemAuthority,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        permissions: role.permissions?.map(p => ({
          resourceName: p.resourceName,
          permission: p.permission,
        }))
      }))
      
      setData(transformedRoles)
    } catch (error) {
      console.error('Failed to load roles:', error)
      toast({
        title: 'Error',
        description: 'Failed to load roles. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadRoles()
  }, [])

  // Filter data based on search term
  const filteredData = data.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle row click for viewing role details
  const handleRowClick = (row: RolesRow) => {
    router.push(`roles/${row.id}`)
  }

  // Handle create role
  const handleCreateRole = () => {
    setEditingRole(null)
    setIsCreateModalOpen(true)
  }

  // Handle edit role
  const handleEditRole = (role: RolesRow) => {
    setEditingRole(role)
    setIsCreateModalOpen(true)
  }

  // Handle delete role
  const handleDeleteRole = async (roleId: string) => {
    try {
      await rolesApi.deleteRole(roleId)
      toast({
        title: 'Success',
        description: 'Role deleted successfully.',
      })
      // Reload data
      await loadRoles()
    } catch (error) {
      console.error('Failed to delete role:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete role. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Handle modal close and reload data
  const handleModalClose = async (shouldReload = false) => {
    setIsCreateModalOpen(false)
    setEditingRole(null)
    
    if (shouldReload) {
      await loadRoles()
    }
  }

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
          <Button onClick={handleCreateRole} className="h-8 px-2 lg:px-3">
              <PlusCircle className="mr-2 h-4 w-4" />
            Create Role
            </Button>
          </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      {/* Table */}
      <div className="rounded-md border relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="w-[120px]">Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((role) => (
                <TableRow
                  key={role.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(role)}
                >
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{role.name}</span>
                      {role.isSystemAuthority && (
                        <Badge variant="secondary" className="text-xs">
                          System
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <span className="text-sm text-muted-foreground">
                        {role.description || 'No description'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions && role.permissions.length > 0 ? (
                        role.permissions.slice(0, 3).map((perm, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {perm.resourceName}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No permissions</span>
                      )}
                      {role.permissions && role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(role.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditRole(role)
                        }}
                        disabled={role.isSystemAuthority}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRole(role.id)
                        }}
                        disabled={role.isSystemAuthority}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {loading ? 'Loading...' : 'No roles found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CreateEditModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        editingRole={editingRole}
      />
    </div>
  )
}
