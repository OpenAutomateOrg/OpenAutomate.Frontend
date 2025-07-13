'use client'

import React, { useState } from 'react'
import { Row } from '@tanstack/react-table'
import { MoreHorizontal, Download, Pencil, Trash } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AutomationPackageResponseDto } from '@/lib/api/automation-packages'
import { useToast } from '@/components/ui/use-toast'

interface DataTableRowActionsProps {
  row: Row<AutomationPackageResponseDto>
  onRefresh?: () => void
}

export function DataTableRowActions({ row, onRefresh }: DataTableRowActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    // Implement edit functionality
    toast({
      title: 'Edit package',
      description: `Editing package: ${row.original.name}`,
    })
  }

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShowConfirm(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      // Implement delete functionality
      toast({
        title: 'Package deleted',
        description: `Package ${row.original.name} has been deleted.`,
      })
      setShowConfirm(false)
      if (onRefresh) onRefresh()
    } catch (err: unknown) {
      setShowConfirm(false)
      if (err instanceof Error) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg('Failed to delete package.')
      }
      setShowError(true)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    // Get the latest version for download
    const versions = row.original.versions
    if (versions && versions.length > 0) {
      const latestVersion = versions.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
      )[0]
      toast({
        title: 'Downloading package',
        description: `Downloading package: ${row.original.name} version: ${latestVersion.versionNumber}`,
      })
    } else {
      setErrorMsg('No versions available to download.')
      setShowError(true)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>Download</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleDelete}
          >
            <Trash className="mr-2 h-4 w-4 text-destructive" aria-hidden="true" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirm Delete Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div>
            Are you sure you want to delete package <b>{row.original.name}</b>?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="text-white dark:text-neutral-900"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div>{errorMsg}</div>
          <DialogFooter>
            <Button
              variant="destructive"
              className="text-white dark:text-neutral-900"
              onClick={() => setShowError(false)}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
