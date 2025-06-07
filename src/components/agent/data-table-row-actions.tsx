'use client'

import React, { useState } from 'react'
import { Row } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { deleteBotAgent, getBotAgentById } from '@/lib/api/bot-agents'
import { Button } from '@/components/ui/button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AgentRow } from './agent'
import { CreateEditModal } from './create-edit-modal'
import type { BotAgentResponseDto } from '@/lib/api/bot-agents'

interface DataTableRowActionsProps {
  readonly row: Row<AgentRow>
  readonly onRefresh?: () => void
}

export default function DataTableRowAction({ row, onRefresh }: DataTableRowActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editAgent, setEditAgent] = useState<BotAgentResponseDto | null>(null)

  const handleEdit = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (row.original.status !== 'Disconnected') {
      setErrorMsg('You can only edit an agent when its status is "Disconnected".')
      setShowError(true)
      return
    }
    // Fetch agent chi tiết từ API
    try {
      const agentDetail = await getBotAgentById(row.original.id)
      setEditAgent(agentDetail)
      setShowEdit(true)
    } catch {
      setErrorMsg('Failed to fetch agent details.')
      setShowError(true)
    }
  }

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowConfirm(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      if (row.original.status === 'Disconnected') {
        await deleteBotAgent(row.original.id)
        setShowConfirm(false)
        if (onRefresh) onRefresh()
      } else {
        setShowConfirm(false)
        setErrorMsg('You can only delete an agent when its status is "Disconnected".')
        setShowError(true)
      }
    } catch (err: unknown) {
      setShowConfirm(false)
      if (err instanceof Error) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg('Failed to delete agent.')
      }
      setShowError(true)
    } finally {
      setIsDeleting(false)
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
        <DropdownMenuContent align="start" className="w-[160px]" onClick={e => e.stopPropagation()}>
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
            <Trash className="mr-2 h-4 w-4 text-destructive" aria-hidden="true" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Modal */}
      <CreateEditModal
        isOpen={showEdit}
        onClose={() => { setShowEdit(false); setEditAgent(null); }}
        mode="edit"
        agent={editAgent}
        onSuccess={() => {
          setShowEdit(false);
          setEditAgent(null);
          if (onRefresh) onRefresh();
        }}
      />

      {/* Confirm Delete Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent onInteractOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete agent <b>{row.original.name}</b>?</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" className="text-white dark:text-neutral-900" onClick={confirmDelete} disabled={isDeleting}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent onInteractOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div>{errorMsg}</div>
          <DialogFooter>
            <Button variant="destructive" className="text-white dark:text-neutral-900" onClick={() => setShowError(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
