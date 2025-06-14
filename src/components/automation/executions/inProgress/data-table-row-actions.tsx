'use client'

import { Row } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ExecutionsRow } from '../executions'

interface DataTableRowActionsProps {
  row: Row<ExecutionsRow>
  onEdit?: (execution: ExecutionsRow) => void
  onDelete?: (execution: ExecutionsRow) => void
  onRefresh?: () => void
}

export default function DataTableRowAction({ 
  row, 
  onEdit, 
  onDelete, 
  onRefresh 
}: DataTableRowActionsProps) {
  const handleEdit = () => {
    console.log('Edit execution:', row.original)
    onEdit?.(row.original)
  }

  const handleDelete = () => {
    console.log('Delete execution:', row.original)
    onDelete?.(row.original)
    onRefresh?.()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
