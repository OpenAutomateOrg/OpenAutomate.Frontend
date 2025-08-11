'use client'

import { useState } from 'react'
import { Copy, Edit, PlusCircle, AlertCircle, X, Check, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  createBotAgent,
  updateBotAgent,
  getBotAgentById,
  type BotAgentResponseDto,
} from '@/lib/api/bot-agents'

interface ItemModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly mode: 'create' | 'edit'
  readonly agent?: BotAgentResponseDto | null
  readonly onSuccess?: (agent: BotAgentResponseDto) => void
}

export function CreateEditModal({ isOpen, onClose, mode, agent, onSuccess }: ItemModalProps) {
  const { toast } = useToast()

  // ✅ Initialize state based on props (automatically reset via dynamic key in parent)
  const [name, setName] = useState(agent?.name || '')
  const [machineName, setMachineName] = useState(agent?.machineName || '')
  const [isLoading, setIsLoading] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [machineNameError, setMachineNameError] = useState<string | null>(null)
  const [createdAgent, setCreatedAgent] = useState<BotAgentResponseDto | null>(null)

  const isEditing = mode === 'edit'

  // ✅ Validate form and check name uniqueness only when submitting
  const validateForm = async (): Promise<boolean> => {
    // Reset errors
    setNameError(null)
    setMachineNameError(null)

    let isValid = true

    if (!name.trim()) {
      setNameError('Name is required')
      isValid = false
    }

    if (!machineName.trim()) {
      setMachineNameError('Machine name is required')
      isValid = false
    }

    if (!isValid) {
      return false
    }

    if (isEditing) {
      if (name === agent?.name && machineName === agent?.machineName) {
        toast({
          title: 'No Changes',
          description: 'Please change at least one field to update.',
          variant: 'destructive',
        })
        return false
      }
    }

    return true
  }

  const checkAgentStatusForEdit = async (): Promise<boolean> => {
    if (!isEditing || !agent) return true

    const latest = await getBotAgentById(agent.id)
    if (latest.status !== 'Disconnected') {
      toast({
        title: 'Cannot Edit Agent',
        description: 'You can only edit an agent when its status is "Disconnected".',
        variant: 'destructive',
      })
      return false
    }
    return true
  }

  const performAgentOperation = async (): Promise<BotAgentResponseDto> => {
    if (isEditing && agent) {
      const updated = await updateBotAgent(agent.id, {
        name: name !== agent.name ? name : undefined,
        machineName: machineName !== agent.machineName ? machineName : undefined,
      })
      toast({
        title: 'Success',
        description: 'Agent updated successfully',
      })
      return updated
    } else {
      const created = await createBotAgent({ name, machineName })
      toast({
        title: 'Success',
        description: 'Agent created successfully',
      })
      return created
    }
  }

  const handleAgentError = (err: unknown) => {
    let errorMessage = isEditing ? 'Failed to update agent' : 'Failed to create agent'

    if (
      err &&
      typeof err === 'object' &&
      'status' in err &&
      (err as { status: number }).status === 403
    ) {
      errorMessage = 'You do not have permission to perform this action'
    } else if (err && typeof err === 'object' && 'message' in err) {
      errorMessage = String((err as { message: string }).message)
    }

    toast({
      title: isEditing ? 'Update Failed' : 'Creation Failed',
      description: errorMessage,
      variant: 'destructive',
    })
  }

  const handleSubmit = async () => {
    const isValid = await validateForm()
    if (!isValid) return

    setIsLoading(true)
    try {
      const canProceed = await checkAgentStatusForEdit()
      if (!canProceed) {
        setIsLoading(false)
        return
      }

      const updated = await performAgentOperation()
      setCreatedAgent(updated)
      if (onSuccess) onSuccess(updated)
    } catch (err) {
      handleAgentError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Machine key copied to clipboard',
    })
  }

  const resetForm = () => {
    setName('')
    setMachineName('')
    setNameError(null)
    setMachineNameError(null)
    setCreatedAgent(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[500px] p-0 max-h-[85vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex items-center gap-2 p-6 pb-2 border-b">
          {isEditing ? (
            <Edit className="w-5 h-5 text-primary" />
          ) : (
            <PlusCircle className="w-5 h-5 text-primary" />
          )}
          <DialogTitle className="text-xl font-bold">
            {isEditing ? 'Edit Agent' : 'Create a new Agent'}
          </DialogTitle>
        </DialogHeader>
        {!createdAgent ? (
          <form className="space-y-4 px-6 py-4">
            <div>
              <Label htmlFor="name" className="flex items-center gap-1 mb-2">
                Name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameError(null)
                }}
                disabled={isLoading}
                className="bg-white text-black dark:text-white border rounded-xl shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoComplete="off"
                spellCheck="false"
              />
              {nameError && (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {nameError}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="machine-name" className="flex items-center gap-1 mb-2">
                Machine name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="machine-name"
                value={machineName}
                onChange={(e) => {
                  setMachineName(e.target.value)
                  setMachineNameError(null)
                }}
                disabled={isLoading}
                className="bg-white text-black dark:text-white border rounded-xl shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoComplete="off"
                spellCheck="false"
              />
              {machineNameError && (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {machineNameError}
                </div>
              )}
            </div>
          </form>
        ) : (
          // Success state giữ nguyên
          <div className="space-y-4 px-6 py-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md text-sm">
              <p className="font-medium text-green-800 dark:text-green-300 mb-2">
                Agent created successfully!
              </p>
              <p className="text-green-700 dark:text-green-400 mb-4">
                Please copy the machine key below. It will only be shown once.
              </p>
            </div>
            <div className="space-y-1">
              <label htmlFor="machine-key" className="block text-sm font-medium">
                Machine Key
              </label>
              <div className="flex">
                <Input
                  id="machine-key"
                  value={createdAgent.machineKey}
                  readOnly
                  className="flex-1 bg-muted font-mono text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(createdAgent.machineKey)}
                  className="ml-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="p-6 pt-4 border-t bg-background z-10 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <X className="w-4 h-4" /> {createdAgent ? 'Close' : 'Cancel'}
          </Button>
          {!createdAgent && (
            <Button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-1">
              {isEditing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {(() => {
                if (isLoading) return 'Saving...'
                return isEditing ? 'Save Changes' : 'Add Agent'
              })()}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
