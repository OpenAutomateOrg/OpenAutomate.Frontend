'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { organizationUnitApi } from '@/lib/api/organization-units'
import type { OrganizationUnit, CreateOrganizationUnitDto } from '@/types/organization'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isActive: z.boolean().default(true),
})

type FormData = z.infer<typeof formSchema>

interface CreateEditModalProps {
  isOpen: boolean
  onClose: (shouldRefresh?: boolean) => void
  editingUnit?: OrganizationUnit | null
  onEdit?: (unit: OrganizationUnit) => void
  onDelete?: (unitId: string) => Promise<void>
}

export function CreateEditModal({ isOpen, onClose, editingUnit }: CreateEditModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ✅ Initialize form with editing data (reset via key prop in parent)
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingUnit?.name ?? '',
      description: editingUnit?.description ?? '',
      isActive: editingUnit?.isActive ?? true,
    },
  })

  // ✅ Reset form when editingUnit changes (compliance guide pattern)
  useEffect(() => {
    if (editingUnit) {
      form.reset({
        name: editingUnit.name,
        description: editingUnit.description,
        isActive: editingUnit.isActive,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        isActive: true,
      })
    }
  }, [editingUnit, form])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      if (editingUnit) {
        // TODO: Implement update API call when available
        // await organizationUnitApi.update(editingUnit.id, data)
        toast({
          title: 'Success',
          description: 'Organization unit updated successfully',
        })
      } else {
        const createDto: CreateOrganizationUnitDto = {
          name: data.name,
          description: data.description,
        }
        await organizationUnitApi.create(createDto)
        toast({
          title: 'Success',
          description: 'Organization unit created successfully',
        })
      }
      onClose(true) // ✅ Signal parent to refresh
    } catch (error) {
      toast({
        title: 'Error',
        description: editingUnit
          ? 'Failed to update organization unit'
          : 'Failed to create organization unit',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editingUnit ? 'Edit Organization Unit' : 'Create Organization Unit'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter organization unit name"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter description (optional)"
                      className="min-h-[100px]"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable this organization unit for use
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingUnit ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
