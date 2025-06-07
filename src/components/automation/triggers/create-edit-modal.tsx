'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronDown, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
}

export function CreateEditModal({ isOpen, onClose, mode }: ItemModalProps) {
  const isEditing = mode === 'edit'

  const handleSubmit = async () => {
    console.log('handleSubmit')
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] p-6">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Agent' : 'Create a new Agent'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name<span className="text-red-500">*</span>
              </label>
              <Input id="name" className="h-10" />
            </div>

            <div className="space-y-2">
              <label htmlFor="component" className="text-sm font-medium">
                Component<span className="text-red-500">*</span>
              </label>
              <Select defaultValue="task">
                <SelectTrigger id="component" className="h-10">
                  <SelectValue placeholder="Select component" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="trigger">Trigger</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 border border-gray-200 rounded-md p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium uppercase">
                Conditions <span className="text-red-500">*</span>
              </h3>
              <Button variant="destructive" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <ChevronDown className="h-6 w-6 text-green-600" />
          </div>

          <div className="space-y-2 border border-gray-200 rounded-md p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium uppercase">
                Activities <span className="text-red-500">*</span>
              </h3>
              <Button variant="destructive" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>

          <Button onClick={handleSubmit}>Creating</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
