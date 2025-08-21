'use client'

import * as React from 'react'
import { ChangeEvent, useEffect, useState, useRef } from 'react'
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Pencil, Trash } from 'lucide-react'
import useSWR from 'swr'
import { swrKeys } from '@/lib/config/swr-config'

interface OrganizationUnit {
  id: string
  name: string
  description: string
}

interface DeletionStatusResponse {
  // Handle both possible API response formats
  isPendingDeletion?: boolean
  isDeletionPending?: boolean
  scheduledDeletionAt: string | null
  daysUntilDeletion?: number
  hoursUntilDeletion?: number
  remainingSeconds?: number | null
  canCancel?: boolean
}

interface DeletionStatus {
  isPendingDeletion: boolean
  remainingSeconds: number | null
  scheduledDeletionAt: string | null
  canCancel: boolean
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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const { toast } = useToast()
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showCancelDeletionConfirmation, setShowCancelDeletionConfirmation] = useState(false)
  const countdownInitialized = useRef(false)

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

  const handleDelete = () => {
    setShowDeleteConfirmation(true)
  }

  const handleConfirmDelete = async () => {
    if (!organizationUnitId) return
    setShowDeleteConfirmation(false)
    try {
      await organizationUnitApi.requestDeletion(organizationUnitId)

      mutateDeletionStatus()

      toast({
        title: 'Deletion Requested',
        description: 'Organization unit deletion has been initiated.',
      })
    } catch (error: unknown) {
      let message = 'Failed to request deletion.'
      if (error instanceof Error) {
        message = error.message
      }

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const confirmCancelDeletion = async () => {
    if (!organizationUnitId) return
    try {
      await organizationUnitApi.cancelDeletion(organizationUnitId)
      mutateDeletionStatus()
      toast({
        title: 'Deletion Cancelled',
        description: 'Organization unit deletion has been cancelled.',
      })
    } catch (error: unknown) {
      let message = 'Failed to cancel deletion.'
      if (error instanceof Error) {
        message = error.message
      }
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setShowCancelDeletionConfirmation(false)
    }
  }

  // Fetch deletion status from API
  const fetchDeletionStatus = async (): Promise<DeletionStatus> => {
    if (!organizationUnitId) throw new Error('Missing ID')
    const result = await organizationUnitApi.getDeletionStatus(organizationUnitId)
    // Handle both possible API response formats
    const status = result as unknown as DeletionStatusResponse

    // Determine deletion pending status (handle both property names)
    const isPendingDeletion = status.isPendingDeletion ?? status.isDeletionPending ?? false

    // Calculate remainingSeconds (prefer direct value, fallback to calculation from hours)
    let remainingSeconds: number | null = null
    if (typeof status.remainingSeconds === 'number') {
      remainingSeconds = status.remainingSeconds
    } else if (typeof status.hoursUntilDeletion === 'number') {
      remainingSeconds = status.hoursUntilDeletion * 3600
    }

    return {
      isPendingDeletion,
      remainingSeconds,
      scheduledDeletionAt: status.scheduledDeletionAt,
      canCancel: status.canCancel ?? false,
    }
  }

  // SWR hook for automatic status refetching
  const { data: deletionStatusData, mutate: mutateDeletionStatus } = useSWR(
    organizationUnitId ? swrKeys.organizationUnitDeletionStatus(organizationUnitId) : null,
    fetchDeletionStatus,
    {
      refreshInterval: 60000, // Only called once every minute
      refreshWhenHidden: true, // Continue refreshing when tab is hidden
    },
  )

  // Update countdown based on remainingSeconds
  useEffect(() => {
    if (!deletionStatusData?.isPendingDeletion) {
      setCountdown(null)
      countdownInitialized.current = false
      return
    }

    // Initialize countdown with server data only once per deletion session
    // Use >= 0 to handle case where remainingSeconds is 0
    if (
      !countdownInitialized.current &&
      typeof deletionStatusData.remainingSeconds === 'number' &&
      deletionStatusData.remainingSeconds >= 0
    ) {
      setCountdown(deletionStatusData.remainingSeconds)
      countdownInitialized.current = true
    }

    // Update countdown every second
    const interval = setInterval(() => {
      setCountdown((current: number | null) => {
        if (current === null || current <= 0) return 0
        return current - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [deletionStatusData?.isPendingDeletion, deletionStatusData?.remainingSeconds])

  const showDeletionStatus = Boolean(deletionStatusData?.isPendingDeletion)

  // Format remaining time
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Deleting...'
    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((seconds % (60 * 60)) / 60)
    const remainingSeconds = seconds % 60

    const parts = []
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)
    if (remainingSeconds > 0 && parts.length === 0)
      parts.push(`${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`)

    return parts.join(', ')
  }

  return (
    <div className="flex justify-center pt-8">
      <div className="w-full max-w-2xl">
        <div className="bg-background rounded-2xl shadow border border-border px-8 py-7">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-bold">Organization Unit Information</h2>
              <div className="text-sm text-muted-foreground">Details of your organization unit</div>
            </div>
            {!isEditing && !showDeletionStatus && (
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-gray-300 hover:border-[#FF6A1A] hover:bg-[#FFF3EC] rounded-lg font-medium"
                  onClick={handleEdit}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-red-300 hover:border-red-500 hover:bg-red-50 rounded-lg font-medium text-red-600 hover:text-red-600"
                  onClick={handleDelete}
                >
                  <Trash className="h-4 w-4 text-red-600" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {showDeletionStatus && (
            <div className="flex items-center justify-between dark:bg-orange-950/50 bg-orange-50 border border-orange-300 dark:border-orange-800/50 rounded-lg px-4 py-3 my-4">
              <div className="text-orange-700 dark:text-orange-400 font-semibold">
                {typeof countdown === 'number' && countdown > 0
                  ? `This organization unit will be deleted in ${formatTimeRemaining(countdown)}`
                  : 'Deleting organization unit...'}
              </div>
              {deletionStatusData?.canCancel && (
                <Button
                  variant="outline"
                  className="ml-4 border-orange-600 text-orange-700 hover:bg-orange-100"
                  onClick={() => setShowCancelDeletionConfirmation(true)}
                >
                  Cancel Deletion
                </Button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div>
              <label
                htmlFor="ou-name"
                className="block text-xs font-semibold text-muted-foreground mb-1"
              >
                Name
              </label>
              {isEditing ? (
                <Input
                  id="ou-name"
                  value={editedName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditedName(e.target.value)}
                  className="rounded-lg border-input bg-background focus:border-[#FF6A1A] focus:ring-[#FF6A1A]/30"
                  placeholder="Organization unit name"
                />
              ) : (
                <div className="rounded-lg bg-muted px-3 py-2 text-base border border-border">
                  {organizationUnit?.name}
                </div>
              )}
            </div>
            <div>
              <label
                htmlFor="ou-description"
                className="block text-xs font-semibold text-muted-foreground mb-1"
              >
                Description
              </label>
              {isEditing ? (
                <Input
                  id="ou-description"
                  value={editedDescription}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditedDescription(e.target.value)
                  }
                  className="rounded-lg border-input bg-background focus:border-[#FF6A1A] focus:ring-[#FF6A1A]/30"
                  placeholder="Organization unit description"
                />
              ) : (
                <div className="rounded-lg bg-muted px-3 py-2 text-base border border-border">
                  {organizationUnit?.description || (
                    <span className="italic text-muted-foreground">No description</span>
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

        <Dialog open={showNameChangeWarning} onOpenChange={setShowNameChangeWarning}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Warning</DialogTitle>
              <DialogDescription>
                If you change the name, the tenant will also change, which will result in a changed
                URL and the Bot agent will be disconnected. Do you still want to proceed?
              </DialogDescription>
            </DialogHeader>
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

        <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this organization unit? It will be deleted in 7
                days.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDeleteConfirmation(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showCancelDeletionConfirmation}
          onOpenChange={setShowCancelDeletionConfirmation}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Deletion</DialogTitle>
            </DialogHeader>
            <div>Are you sure you want to cancel the deletion of this organization unit?</div>
            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCancelDeletionConfirmation(false)}>
                No
              </Button>
              <Button
                onClick={confirmCancelDeletion}
                className="bg-[#FF6A1A] text-white hover:bg-orange-500"
              >
                Cancel Deletion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
