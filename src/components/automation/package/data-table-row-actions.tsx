'use client'

import { Row } from '@tanstack/react-table'
import { MoreHorizontal, Download, Edit, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AutomationPackageResponseDto } from '@/lib/api/automation-packages'

interface DataTableRowActionsProps {
  row: Row<AutomationPackageResponseDto>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const handleEdit = () => {
    console.log('Edit package:', row.original)
  }

  const handleDelete = () => {
    console.log('Delete package:', row.original)
  }

  const handleDownload = () => {
    // Get the latest version for download
    const versions = row.original.versions
    if (versions && versions.length > 0) {
      const latestVersion = versions.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )[0]
      console.log('Download package:', row.original.id, 'version:', latestVersion.versionNumber)
    }
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
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
