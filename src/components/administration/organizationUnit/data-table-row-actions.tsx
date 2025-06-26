'use client'

import { Row } from '@tanstack/react-table'
import { MoreHorizontal, Edit, Trash2, Users, Eye } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { OrganizationUnitRow } from './organizationUnit'

interface DataTableRowActionsProps {
  row: Row<OrganizationUnitRow>
  onEdit?: (unit: OrganizationUnitRow) => void
  onDelete?: (unitId: string) => void
  onViewUsers?: (unitId: string) => void
}

export default function DataTableRowAction({
  row,
  onEdit,
  onDelete,
  onViewUsers,
}: DataTableRowActionsProps) {
  const unit = row.original

  const handleEdit = () => {
    onEdit?.(unit)
  }

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${unit.name}"? This action cannot be undone.`,
      )
    ) {
      onDelete?.(unit.id)
    }
  }

  const handleViewUsers = () => {
    onViewUsers?.(unit.id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem onClick={() => console.log('View details for:', unit.name)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewUsers}>
          <Users className="mr-2 h-4 w-4" />
          Manage Users
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
