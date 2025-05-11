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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
}

export function CreateEditModal({ isOpen, onClose, mode }: ItemModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [assignToUsers, setAssignToUsers] = useState(false)

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
          <DialogTitle>{isEditing ? 'Edit AssetAsset' : 'Create a new Asset'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm">
              Name<span className="text-red-500">*</span>
            </Label>
            <Input id="name" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type" className="text-sm">
              Type<span className="text-red-500">*</span>
            </Label>
            <Select defaultValue="STRING">
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STRING">STRING</SelectItem>
                <SelectItem value="NUMBER">NUMBER</SelectItem>
                <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                <SelectItem value="OBJECT">OBJECT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="common" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="common"
                className="text-sm text-red-500 data-[state=active]:text-red-500 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:rounded-none data-[state=active]:shadow-none"
              >
                Common Value
              </TabsTrigger>
              <TabsTrigger
                value="agent"
                className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:rounded-none data-[state=active]:shadow-none"
              >
                Value Per Agent
              </TabsTrigger>
            </TabsList>

            <TabsContent value="common" className="mt-4">
              <div className="grid gap-2">
                <Label htmlFor="value" className="text-sm">
                  Value<span className="text-red-500">*</span>
                </Label>
                <Input id="value" placeholder="Type a string value" />
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <Switch
                  id="assign-users"
                  checked={assignToUsers}
                  onCheckedChange={setAssignToUsers}
                />
                <Label htmlFor="assign-users" className="text-sm">
                  Assign all values to specific users
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="agent" className="mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="agent" className="text-sm">
                    Agent<span className="text-red-500">*</span>
                  </Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Agent..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent1">Agent 1</SelectItem>
                      <SelectItem value="agent2">Agent 2</SelectItem>
                      <SelectItem value="agent3">Agent 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="agentValue" className="text-sm">
                    Value<span className="text-red-500">*</span>
                  </Label>
                  <Input id="agentValue" placeholder="Type a string value" />
                </div>

                <div>
                  <Button
                    variant="secondary"
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                  >
                    Add
                  </Button>
                </div>

                <div className="mt-2">
                  <div className="bg-gray-50 rounded-sm">
                    <div className="grid grid-cols-4 gap-2 p-3 text-sm font-medium text-gray-500">
                      <div>Action</div>
                      <div>Agent</div>
                      <div>Value</div>
                      <div>Assign to</div>
                    </div>
                    <div className="p-4 text-center text-sm text-gray-500">No data...</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <Switch
                    id="assign-users-agent"
                    checked={assignToUsers}
                    onCheckedChange={setAssignToUsers}
                  />
                  <Label htmlFor="assign-users-agent" className="text-sm">
                    Assign all values to specific users
                  </Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{isEditing ? 'Save Changes' : 'Add Item'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
