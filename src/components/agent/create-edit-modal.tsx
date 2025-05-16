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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { agentApi } from '@/lib/api/agent'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  onSuccess?: () => void
}

export function CreateEditModal({ isOpen, onClose, mode, onSuccess }: ItemModalProps) {
  const [name, setName] = useState('')
  const [machineName, setMachineName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

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
    if (!validateForm()) return

    setIsLoading(true)
    setStatusMessage(null)
    
    try {
      // Create new agent
      await agentApi.create({
        name,
        machineName
      })

      setStatusMessage({
        type: 'success', 
        message: `Agent ${isEditing ? 'updated' : 'created'} successfully.`
      })

      // Reset form and close modal after a brief delay to show success message
      setTimeout(() => {
        resetForm()
        onClose()
        
        // Trigger refresh of data if success callback provided
        if (onSuccess) {
          onSuccess()
        }
      }, 1500)
      
    } catch (error: unknown) {
      console.error('Error creating agent:', error);
      
      // Try to extract more detailed error information
      let errorMessage = 'Failed to create agent. Please try again.';
      
      if (error && typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;
        
        if (errorObj.details && typeof errorObj.details === 'string') {
          errorMessage = errorObj.details;
        } else if (errorObj.message && typeof errorObj.message === 'string') {
          errorMessage = errorObj.message;
        }
        
        // If error is a network error
        if (errorObj.status === 0) {
          errorMessage = 'Network error. Please check your connection and API server status.';
        } else if (errorObj.status && typeof errorObj.status === 'number') {
          errorMessage += ` (Status: ${errorObj.status})`;
        }
      }
      
      setStatusMessage({
        type: 'error',
        message: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setMachineName('')
    setErrors({})
    setStatusMessage(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] p-6">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Agent' : 'Create a new Agent'}</DialogTitle>
          {statusMessage && (
            <div className={`mt-2 p-2 text-sm rounded ${
              statusMessage.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {statusMessage.message}
            </div>
          )}
        </DialogHeader>
        <Tabs defaultValue="agent">
          <TabsList className="border-b w-full rounded-none mb-6 gap-8">
            <TabsTrigger
              value="agent"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500 pb-2"
            >
              Agent
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500 pb-2"
            >
              Agent Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agent" className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm">
                Name<span className="text-red-500">*</span>
              </label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter agent name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="machine-name" className="block text-sm">
                Machine name<span className="text-red-500">*</span>
              </label>
              <Input 
                id="machine-name" 
                value={machineName} 
                onChange={(e) => setMachineName(e.target.value)}
                placeholder="Enter machine name"
                className={errors.machineName ? "border-red-500" : ""}
              />
              {errors.machineName && <p className="text-xs text-red-500 mt-1">{errors.machineName}</p>}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Windows Session</h3>
              <div className="flex gap-6 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="windowsSession"
                    value="console"
                    defaultChecked
                    className="h-4 w-4"
                  />
                  <span>Console</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="windowsSession" value="rdp" className="h-4 w-4" />
                  <span>RDP</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4" />
                <span>Login To Console</span>
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4" />
                <span>Font Smoothing</span>
              </label>
            </div>

            <div className="space-y-1">
              <label htmlFor="resolution-width" className="block text-sm">
                Resolution Width
              </label>
              <Input id="resolution-width" />
            </div>

            <div className="space-y-1">
              <label htmlFor="resolution-height" className="block text-sm">
                Resolution Height
              </label>
              <Input id="resolution-height" />
            </div>

            <div className="space-y-1">
              <label htmlFor="resolution-depth" className="block text-sm">
                Resolution Depth
              </label>
              <Input id="resolution-depth" />
            </div>

            <div className="space-y-1">
              <label htmlFor="others" className="block text-sm">
                Others
              </label>
              <Input id="others" />
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Processing..." : isEditing ? "Save Changes" : "Add Agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
