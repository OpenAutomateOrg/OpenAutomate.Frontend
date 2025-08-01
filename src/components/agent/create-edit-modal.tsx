'use client'

import { useState, useEffect } from 'react'
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
import {
  createBotAgent,
  type BotAgentResponseDto,
  updateBotAgent,
  getBotAgentById,
} from '@/lib/api/bot-agents'
import { Label } from '@/components/ui/label'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  agent?: BotAgentResponseDto | null
  onSuccess?: (agent: BotAgentResponseDto) => void
}

export function CreateEditModal({ isOpen, onClose, mode, agent, onSuccess }: ItemModalProps) {
  const [name, setName] = useState(agent?.name || '')
  const [machineName, setMachineName] = useState(agent?.machineName || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdAgent, setCreatedAgent] = useState<BotAgentResponseDto | null>(null)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorDialogMsg, setErrorDialogMsg] = useState('')

  useEffect(() => {
    if (agent) {
      setName(agent.name)
      setMachineName(agent.machineName)
    }
  }, [agent])

  const isEditing = mode === 'edit'

  const validateForm = () => {
    if (isEditing) {
      if (
        (name === agent?.name || !name.trim()) &&
        (machineName === agent?.machineName || !machineName.trim())
      ) {
        setError('Please change at least one field to update.')
        return false
      }
      return true
    } else {
      if (!name.trim() || !machineName.trim()) {
        setError('Please fill in all required fields')
        return false
      }
      return true
    }
  }

  // Format error messages from different error types
  const formatErrorMessage = (err: unknown): string => {
    let errorMessage = 'Failed to create agent. Please try again.'

    if (typeof err === 'object' && err !== null) {
      if ('message' in err) {
        errorMessage = String(err.message)
      }

      if ('status' in err) {
        errorMessage += ` (Status: ${(err as { status: string }).status})`
      }

      if ('details' in err) {
        errorMessage += ` - ${(err as { details: string }).details}`
      }

      // Log more details for debugging
      console.error('Error details:', JSON.stringify(err, null, 2))
    }

    return errorMessage
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      let updated: BotAgentResponseDto
      if (isEditing) {
        // Always re-fetch agent status before update
        const latest = await getBotAgentById(agent!.id)
        if (latest.status !== 'Disconnected') {
          setErrorDialogMsg('You can only edit an agent when its status is "Disconnected".')
          setShowErrorDialog(true)
          setIsLoading(false)
          return
        }
        updated = await updateBotAgent(agent!.id, {
          name: name !== agent!.name ? name : undefined,
          machineName: machineName !== agent!.machineName ? machineName : undefined,
        })
      } else {
        updated = await createBotAgent({ name, machineName })
      }
      setCreatedAgent(updated)
      if (onSuccess) onSuccess(updated)
    } catch (err) {
      setError(formatErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    console.log('Copied to clipboard')
  }

  const resetForm = () => {
    setName('')
    setMachineName('')
    setError(null)
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                disabled={isLoading}
                className="bg-white text-black dark:text-white border rounded-xl shadow focus:border-primary focus:ring-2 focus:ring-primary/20 mb-2"
                autoComplete="off"
                spellCheck="false"
                onFocus={(e) => {
                  setTimeout(() => {
                    const len = e.target.value.length
                    e.target.setSelectionRange(len, len)
                  }, 0)
                }}
              />
              {error && error.includes('Name') && (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
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
                onChange={(e) => setMachineName(e.target.value)}
                disabled={isLoading}
                className="bg-white text-black dark:text-white border rounded-xl shadow focus:border-primary focus:ring-2 focus:ring-primary/20 mt-2"
                autoComplete="off"
                spellCheck="false"
              />
              {error && error.includes('Machine') && (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
            {error && !error.includes('Name') && !error.includes('Machine') && (
              <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
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
              {isEditing ? 'Save Changes' : 'Add Agent'}
            </Button>
          )}
        </DialogFooter>
        {/* Error Dialog for status check */}
        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
            </DialogHeader>
            <div>{errorDialogMsg}</div>
            <DialogFooter>
              <Button onClick={() => setShowErrorDialog(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
