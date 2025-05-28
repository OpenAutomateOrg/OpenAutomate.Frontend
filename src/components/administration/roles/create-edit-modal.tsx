'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
}

const resources = [
  'ADMIN RESOURCE',
  'ENVIRONMENT RESOURCE',
  'ROBOT RESOURCE',
  'PACKAGE RESOURCE',
  'WORKFLOW RESOURCE',
  'JOB RESOURCE',
  'SCHEDULE RESOURCE',
]

const permissions = ['none', 'read', 'write', 'admin'] as const

export function CreateEditModal({ isOpen, onClose }: ItemModalProps) {
  const [roleName, setRoleName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [resourcePermissions, setResourcePermissions] = useState<
    Record<string, (typeof permissions)[number]>
  >(resources.reduce((acc, r) => ({ ...acc, [r]: 'none' }), {}))

  const handlePermissionChange = (resource: string, value: string) => {
    setResourcePermissions((prev) => ({
      ...prev,
      [resource]: value as (typeof permissions)[number],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // You’ll probably call your API here:
      console.log({ roleName, resourcePermissions })
    } finally {
      setIsLoading(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create new roles</DialogTitle>
          </DialogHeader>

          {/* Role name */}
          <div className="space-y-2 py-4">
            <Label htmlFor="roleName">Name*</Label>
            <Input
              id="roleName"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Enter role name"
            />
          </div>

          {/* Resource permissions */}
          <div className="space-y-4">
            {resources.map((resource) => (
              <div key={resource} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{resource}</span>
                  <RadioGroup
                    value={resourcePermissions[resource]}
                    onValueChange={(val) => handlePermissionChange(resource, val)}
                    className="flex space-x-6"
                  >
                    {permissions.map((p) => (
                      <div key={p} className="flex items-center space-x-1">
                        <RadioGroupItem value={p} id={`${resource}-${p}`} />
                        <Label htmlFor={`${resource}-${p}`}>{p}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-6">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
