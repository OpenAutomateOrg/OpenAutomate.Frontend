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
import type { CreateEditModalProps } from '@/types/modal'
import type { FormField } from '@/types/modal'

export function CreateEditModal<T extends Record<string, unknown>>({
  isOpen,
  onClose,
  onSubmit,
  mode,
  item,
  schema,
  formFields,
}: CreateEditModalProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form data when modal opens or item changes
  useEffect(() => {
    if (mode === 'edit' && item) {
      setFormData({ ...item })
    } else {
      // Initialize empty form for create mode
      const initialData: Partial<T> = {}
      schema.forEach((field) => {
        initialData[field.accessorKey as keyof T] = '' as T[keyof T]
      })
      setFormData(initialData)
    }
    // Clear errors when modal opens/closes
    setErrors({})
  }, [mode, item, schema, isOpen])

  // Handle input change
  const handleInputChange = (field: keyof T, value: T[keyof T]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error for this field if it exists
    if (errors[field as string]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field as string]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Check required fields from formFields if provided
    if (formFields) {
      formFields.forEach((field) => {
        if (field.required && !formData[field.id as keyof T]) {
          newErrors[field.id] = `${field.label} is required`
        }

        // Email validation
        if (field.type === 'email' && formData[field.id as keyof T]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(formData[field.id as keyof T] as string)) {
            newErrors[field.id] = 'Please enter a valid email address'
          }
        }
      })
    } else {
      // Basic validation if formFields not provided
      schema.forEach((field) => {
        const key = field.accessorKey as keyof T
        if (!formData[key]) {
          newErrors[key as string] = `${field.header} is required`
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      onSubmit(formData as T)
    }
  }

  // Render form fields based on schema or formFields
  const renderFormField = (
    field: FormField | { accessorKey: keyof T; header: string; id: string },
  ) => {
    const isFormField = 'type' in field
    const fieldId = isFormField ? field.id : (field.accessorKey as string)
    const fieldLabel = isFormField ? field.label : field.header
    const fieldType = isFormField ? field.type : 'text'
    const fieldOptions = isFormField ? field.options : undefined
    const fieldRequired = isFormField ? field.required : false

    // For select fields
    if (fieldType === 'select' && fieldOptions) {
      return (
        <div className="grid gap-2" key={fieldId}>
          <Label htmlFor={fieldId} className="flex items-center">
            {fieldLabel}
            {fieldRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select
            value={(formData[fieldId as keyof T] as string) || ''}
            onValueChange={(value) => handleInputChange(fieldId as keyof T, value as T[keyof T])}
          >
            <SelectTrigger id={fieldId} className={errors[fieldId] ? 'border-destructive' : ''}>
              <SelectValue placeholder={`Select ${fieldLabel}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors[fieldId] && <p className="text-xs text-destructive">{errors[fieldId]}</p>}
        </div>
      )
    }

    // For number fields
    if (fieldType === 'number') {
      return (
        <div className="grid gap-2" key={fieldId}>
          <Label htmlFor={fieldId} className="flex items-center">
            {fieldLabel}
            {fieldRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={fieldId}
            type="number"
            value={(formData[fieldId as keyof T] as string) || ''}
            onChange={(e) => handleInputChange(fieldId as keyof T, e.target.value as T[keyof T])}
            className={errors[fieldId] ? 'border-destructive' : ''}
          />
          {errors[fieldId] && <p className="text-xs text-destructive">{errors[fieldId]}</p>}
        </div>
      )
    }

    // Default input field (text, email, etc)
    return (
      <div className="grid gap-2" key={fieldId}>
        <Label htmlFor={fieldId} className="flex items-center">
          {fieldLabel}
          {fieldRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id={fieldId}
          type={fieldType}
          value={(formData[fieldId as keyof T] as string) || ''}
          onChange={(e) => handleInputChange(fieldId as keyof T, e.target.value as T[keyof T])}
          className={errors[fieldId] ? 'border-destructive' : ''}
        />
        {errors[fieldId] && <p className="text-xs text-destructive">{errors[fieldId]}</p>}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Item' : 'Edit Item'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new item.'
              : 'Update the details of the selected item.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {formFields ? formFields.map(renderFormField) : schema.map(renderFormField)}
          </div>

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
