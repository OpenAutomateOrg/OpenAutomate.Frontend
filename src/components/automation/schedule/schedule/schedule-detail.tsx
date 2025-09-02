'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/loading-spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { CreateEditModal } from './create-edit-modal'
import {
  ArrowLeft,
  Clock,
  Package,
  Bot,
  Calendar,
  Settings,
  Play,
  Pause,
  AlertCircle,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { RecurrenceType } from '@/lib/api/schedules'
import { useSchedule, useScheduleFormatting, useBotAgent } from '@/hooks/use-schedule'

interface ScheduleDetailProps {
  readonly id: string
}

// Helper function to get badge class based on status
const getStatusBadgeClass = (isEnabled: boolean) => {
  if (isEnabled) return 'bg-green-100 text-green-600 border-none'
  return 'bg-red-100 text-red-600 border-none'
}

// Helper function to format recurrence type display
const formatRecurrenceType = (type: RecurrenceType): string => {
  const typeMap = {
    [RecurrenceType.Once]: 'One Time',
    [RecurrenceType.Minutes]: 'Every Minutes',
    [RecurrenceType.Hourly]: 'Hourly',
    [RecurrenceType.Daily]: 'Daily',
    [RecurrenceType.Weekly]: 'Weekly',
    [RecurrenceType.Advanced]: 'Advanced (Cron)',
  }
  return typeMap[type] || type
}

export default function ScheduleDetail({ id }: Readonly<ScheduleDetailProps>) {
  const router = useRouter()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ✅ Use custom hook for schedule data and actions
  const {
    schedule,
    isLoading,
    error,
    toggleStatus,
    deleteScheduleAction,
    mutate: refreshSchedule,
  } = useSchedule(id)

  // ✅ Use custom hook for agent data
  const { agent, mutate: refreshAgent } = useBotAgent(schedule?.botAgentId || null)

  // ✅ Use custom hook for data formatting
  const formattedData = useScheduleFormatting(schedule || null)

  // ✅ Event handlers for user actions
  const handleBack = () => {
    router.back()
  }

  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  const handleDelete = async () => {
    if (!schedule) return
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!schedule) return

    setDeleting(true)
    try {
      await deleteScheduleAction()
      setDeleteDialogOpen(false)
      // Navigate back to list after successful delete
      router.back()
    } catch (error) {
      console.error('Delete failed:', error)
      // Error notification is handled in the hook
    } finally {
      setDeleting(false)
    }
  }

  const handleCloseEditModal = (shouldRefresh?: boolean) => {
    setIsEditModalOpen(false)
    if (shouldRefresh) {
      // ✅ Refresh both schedule and agent data after edit
      refreshSchedule()
      refreshAgent()
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <LoadingState message="Loading schedule details..." />
      </div>
    )
  }

  if (error || !schedule) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="border rounded-md shadow-sm">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <div className="text-lg font-medium">Schedule not found</div>
              <div className="text-sm text-muted-foreground mt-2">
                The schedule you&apos;re looking for doesn&apos;t exist or has been deleted.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div>
      {/* Header with Back Button and Actions */}
      <Card className="border rounded-md shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between  py-2">
          <Button size="sm" className="gap-1" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to Schedules
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Settings className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant={schedule.isEnabled ? 'secondary' : 'default'} onClick={toggleStatus}>
              {schedule.isEnabled ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Disable
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Enable
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {/* Main Schedule Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Basic Information */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <DetailBlock label="Name">{schedule.name}</DetailBlock>
                  <DetailBlock label="Status">
                    <Badge variant="outline" className={getStatusBadgeClass(schedule.isEnabled)}>
                      {schedule.isEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </DetailBlock>
                </div>
                <div className="space-y-4">
                  <DetailBlock label="Recurrence Type">
                    {formatRecurrenceType(schedule.recurrenceType)}
                  </DetailBlock>
                  <DetailBlock label="Time Zone">{schedule.timeZoneId}</DetailBlock>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Execution Details */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Execution Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedule.nextRunTime && (
                <DetailBlock label="Next Run Time">
                  <div className="text-sm font-medium text-blue-600">
                    {formattedData?.nextRunDate}
                  </div>
                </DetailBlock>
              )}
              <DetailBlock label="Created">{formattedData?.createdDate}</DetailBlock>
              <DetailBlock label="Last Updated">{formattedData?.updatedDate}</DetailBlock>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Automation Package
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailBlock label="Package Name">
                {schedule.automationPackageName || 'N/A'}
              </DetailBlock>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Bot Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailBlock label="Agent Name">{schedule.botAgentName || 'N/A'}</DetailBlock>
                <DetailBlock label="Machine Name">{agent?.machineName || 'N/A'}</DetailBlock>
              </div>
            </CardContent>
          </Card>
          {/* Resource Information */}
        </div>
      </Card>

      {/* Edit Modal */}
      <CreateEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        mode="edit"
        editingSchedule={
          schedule
            ? {
                id: schedule.id,
                name: schedule.name,
                packageId: schedule.automationPackageId,
                packageVersion: 'latest',
                agentId: schedule.botAgentId,
                timezone: schedule.timeZoneId,
                recurrence: {
                  type: schedule.recurrenceType,
                  value: '1',
                },
                oneTimeExecution: schedule.oneTimeExecution || '',
              }
            : null
        }
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{schedule?.name}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Enhanced DetailBlock component
function DetailBlock({ label, children }: Readonly<{ label: string; children?: React.ReactNode }>) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="text-base">{children}</div>
    </div>
  )
}
