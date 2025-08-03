'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useParams } from 'next/navigation'
import { organizationUnitApi } from '@/lib/api/organization-units'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'

interface OrganizationUnit {
  id: string
  name: string
  description: string
}

export default function OrganizationUnitProfile() {
  const params = useParams()
  const slug = params.tenant as string | undefined
  const [organizationUnitId, setOrganizationUnitId] = useState<string | null>(null)
  const [organizationUnit, setOrganizationUnit] = useState<OrganizationUnit | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [showNameChangeWarning, setShowNameChangeWarning] = useState(false)
  const [pendingSave, setPendingSave] = useState(false)
  const { toast } = useToast()

  // Step 1: Get OU id from slug
  useEffect(() => {
    if (!slug) {
      setOrganizationUnitId(null)
      return
    }
    organizationUnitApi
      .getBySlug(slug)
      .then((ou) => {
        setOrganizationUnitId(ou.id)
      })
      .catch(() => {
        setOrganizationUnitId(null)
      })
  }, [slug])

  // Step 2: Get OU info by id
  useEffect(() => {
    if (!organizationUnitId) return
    organizationUnitApi
      .getById(organizationUnitId)
      .then((ou) => {
        setOrganizationUnit(ou)
        setEditedName(ou.name)
        setEditedDescription(ou.description)
      })
      .catch(() => {
        setOrganizationUnit(null)
      })
  }, [organizationUnitId])

  const handleEdit = () => {
    if (!organizationUnit) return
    setEditedName(organizationUnit.name)
    setEditedDescription(organizationUnit.description)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!editedName.trim()) {
      toast({
        title: 'Error',
        description: 'Organization unit name cannot be empty',
        variant: 'destructive',
      })
      return
    }
    if (!organizationUnitId) return
    if (organizationUnit && editedName.trim() !== organizationUnit.name) {
      setShowNameChangeWarning(true)
      return
    }
    setIsSaving(true)
    try {
      const updated = await organizationUnitApi.update(organizationUnitId, {
        name: editedName,
        description: editedDescription,
      })
      setOrganizationUnit(updated)
      setIsEditing(false)
      toast({
        title: 'Success',
        description: 'Organization unit information updated successfully',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Update failed',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAcceptNameChange = async () => {
    if (!organizationUnitId) {
      toast({
        title: 'Error',
        description: 'Organization unit ID is missing. Please try again.',
        variant: 'destructive',
      })
      return
    }
    setPendingSave(true)
    try {
      const updated = await organizationUnitApi.update(organizationUnitId, {
        name: editedName,
        description: editedDescription,
      })
      setOrganizationUnit(updated)
      setIsEditing(false)
      setShowNameChangeWarning(false)
      toast({
        title: 'Success',
        description: 'Organization unit information updated successfully',
      })
      window.location.href = '/tenant-selector'
    } catch {
      toast({
        title: 'Error',
        description: 'Update failed',
        variant: 'destructive',
      })
    } finally {
      setPendingSave(false)
    }
  }

  return (
    <div className="flex justify-center pt-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow border border-gray-200 px-8 py-7">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Organization Unit Information</h2>
              <div className="text-sm text-gray-400">Details of your organization unit</div>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-gray-300 hover:border-[#FF6A1A] hover:bg-[#FFF3EC] rounded-lg font-medium"
                onClick={handleEdit}
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="rounded-lg border-gray-200 bg-gray-50 focus:border-[#FF6A1A] focus:ring-[#FF6A1A]/30"
                  placeholder="Organization unit name"
                />
              ) : (
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-base text-gray-900 border border-gray-100">
                  {organizationUnit?.name}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
              {isEditing ? (
                <Input
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="rounded-lg border-gray-200 bg-gray-50 focus:border-[#FF6A1A] focus:ring-[#FF6A1A]/30"
                  placeholder="Organization unit description"
                />
              ) : (
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-base text-gray-900 border border-gray-100">
                  {organizationUnit?.description || (
                    <span className="italic text-gray-400">No description</span>
                  )}
                </div>
              )}
            </div>
          </div>
          {isEditing && (
            <div className="flex justify-end gap-2 mt-8">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg bg-[#FF6A1A] text-white hover:bg-orange-500"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
        {/* Name change warning dialog */}
        <Dialog open={showNameChangeWarning} onOpenChange={setShowNameChangeWarning}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Warning</DialogTitle>
            </DialogHeader>
            <div>
              If you change the name, the tenant will also change, which will result in a changed
              URL and the Bot agent will be disconnected. Do you still want to proceed?
            </div>
            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowNameChangeWarning(false)}
                disabled={pendingSave}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAcceptNameChange}
                disabled={pendingSave}
                className="bg-[#FF6A1A] text-white hover:bg-orange-500"
              >
                Accept
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
