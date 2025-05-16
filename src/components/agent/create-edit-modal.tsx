'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAgentApi, AgentApiError, AgentApiErrorType } from '@/lib/api/agent'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  onSuccess?: () => void
}

export function CreateEditModal({ isOpen, onClose, mode, onSuccess }: ItemModalProps) {
  const agentApi = useAgentApi()
  const [name, setName] = useState('')
  const [machineName, setMachineName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const isEditing = mode === 'edit'

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!machineName.trim()) {
      newErrors.machineName = 'Machine name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsSubmitting(true)
      setApiError(null)
      
      try {
        // Submit data to the API
        await agentApi.create({
          name,
          machineName
        })
        
        // Reset form and close modal
        resetForm()
        onClose()
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess()
        }
      } catch (error) {
        if (error instanceof AgentApiError) {
          // Handle specific API errors
          switch (error.type) {
            case AgentApiErrorType.VALIDATION:
              setApiError('Please check the form fields and try again.')
              break
            case AgentApiErrorType.AUTHENTICATION:
              setApiError('You do not have permission to create agents.')
              break
            case AgentApiErrorType.NETWORK:
              setApiError('Network error. Please check your connection and try again.')
              break
            default:
              setApiError(`Error creating agent: ${error.message}`)
          }
        } else {
          setApiError('An unexpected error occurred. Please try again.')
        }
        console.error('Error creating agent:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const resetForm = () => {
    setName('')
    setMachineName('')
    setErrors({})
    setApiError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Agent' : 'Create a new Agent'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {apiError && (
            <div className="p-3 text-sm rounded-md bg-red-50 text-red-600 border border-red-200">
              {apiError}
            </div>
          )}
          
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm">
              Name<span className="text-red-500">*</span>
            </label>
            <Input 
              id="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="machine-name" className="block text-sm">
              Machine name<span className="text-red-500">*</span>
            </label>
            <Input 
              id="machine-name" 
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              className={errors.machineName ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.machineName && <p className="text-red-500 text-xs mt-1">{errors.machineName}</p>}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : isEditing ? 'Save Changes' : 'Add Agent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
