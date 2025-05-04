'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

interface Column {
  id: string
  header: string
  accessorKey: string
}

interface CreateEditModalProps<T> {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: T) => void
  mode: 'create' | 'edit'
  item: T | null
  schema: Column[]
}

export function CreateEditModal<T>({
  isOpen,
  onClose,
  onSubmit,
  mode,
  item,
  schema,
}: CreateEditModalProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>({})

  // Initialize form data when modal opens or item changes
  useEffect(() => {
    if (mode === 'edit' && item) {
      setFormData({ ...item })
    } else {
      // Initialize empty form for create mode
      const initialData = schema.reduce((acc, field) => {
        acc[field.accessorKey as keyof T] = '' as T[keyof T]
        return acc
      }, {} as Partial<T>)
      setFormData(initialData)
    }
  }, [mode, item, schema])

  // Handle input change
  const handleInputChange = (field: keyof T, value: T[keyof T]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData as T)
  }

  // Render form fields based on schema
  const renderFormField = (field: Column) => {
    // Special handling for status field (as an example)
    if (field.accessorKey === 'status') {
      return (
        <div className="grid gap-2" key={field.id}>
          <Label htmlFor={field.accessorKey}>{field.header}</Label>
          <Select
            value={(formData[field.accessorKey as keyof T] as string) || ''}
            onValueChange={(value) =>
              handleInputChange(field.accessorKey as keyof T, value as T[keyof T])
            }
          >
            <SelectTrigger id={field.accessorKey}>
              <SelectValue placeholder={`Select ${field.header}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    // Default input field
    return (
      <div className="grid gap-2" key={field.id}>
        <Label htmlFor={field.accessorKey}>{field.header}</Label>
        <Input
          id={field.accessorKey}
          value={(formData[field.accessorKey as keyof T] as string) || ''}
          onChange={(e) =>
            handleInputChange(field.accessorKey as keyof T, e.target.value as T[keyof T])
          }
        />
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Item' : 'Edit Item'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new item.'
              : 'Update the details of the selected item.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">{schema.map(renderFormField)}</div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{mode === 'create' ? 'Create' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
