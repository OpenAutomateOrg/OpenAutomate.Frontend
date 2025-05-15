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
import { Textarea } from '@/components/ui/textarea'
import { Copy } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
}

export function CreateEditModal({ isOpen, onClose, mode }: ItemModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')

  const [key] = useState('2dda9826-f37d-96e6-e2d6-92c19bf637c0')

  const copyToClipboard = () => {
    navigator.clipboard.writeText(key)
  }

  const isEditing = mode === 'edit'

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!category.trim()) {
      newErrors.category = 'Category is required'
    }

    if (!price.trim()) {
      newErrors.price = 'Price is required'
    } else if (isNaN(Number.parseFloat(price)) || Number.parseFloat(price) <= 0) {
      newErrors.price = 'Price must be a positive number'
    }

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
    }
  }

  const resetForm = () => {
    setName('')
    setCategory('')
    setPrice('')
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
              <label htmlFor="key" className="block text-sm">
                Key<span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <Input id="key" value={key} readOnly className="flex-1" />
                <Button variant="ghost" size="icon" onClick={copyToClipboard} className="ml-2">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm">
                Name<span className="text-red-500">*</span>
              </label>
              <Input id="name" />
            </div>

            <div className="space-y-1">
              <label htmlFor="machine-name" className="block text-sm">
                Machine name<span className="text-red-500">*</span>
              </label>
              <Input id="machine-name" />
            </div>

            <div className="space-y-1">
              <label htmlFor="description" className="block text-sm">
                Description
              </label>
              <Textarea id="description" />
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
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{isEditing ? 'Save Changes' : 'Add Agent'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
