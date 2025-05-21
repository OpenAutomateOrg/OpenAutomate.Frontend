'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
}

export function CreateEditModal({ isOpen, onClose, mode }: ItemModalProps) {
  const isEditing = mode === 'edit'
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

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

        <div className="py-4">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <p className="text-sm text-gray-500">
                {file ? file.name : 'Click to add package file here'}
              </p>
            </div>
            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
          </label>
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
