'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'

// API imports
import {
  createSchedule,
  updateSchedule,
  CreateScheduleDto,
  RecurrenceType,
} from '@/lib/api/schedules'
import {
  getAllAutomationPackages,
  AutomationPackageResponseDto,
  PackageVersionResponseDto,
} from '@/lib/api/automation-packages'
import { swrKeys } from '@/lib/swr-config'
import { createErrorToast } from '@/lib/utils/error-utils'

// Sub-components
import { TriggerTab } from './components/TriggerTab'
import { ExecutionTargetTab } from './components/ExecutionTargetTab'

// Types
export interface ScheduleFormData {
  name: string
  packageId: string
  packageVersion: string
  agentId: string
  timezone: string
  recurrence: {
    type: RecurrenceType
    value: string
    startDate?: Date
    endDate?: Date
    startTime?: string
    dailyHour?: string
    dailyMinute?: string
    weeklyHour?: string
    weeklyMinute?: string
    selectedDays?: string[]
    monthlyHour?: string
    monthlyMinute?: string
    monthlyOnType?: 'day' | 'the'
    selectedDay?: string
    selectedOrdinal?: string
    selectedWeekday?: string
    selectedMonths?: string[]
  }
}

interface ScheduleData {
  id?: string
  name?: string
  packageId?: string
  packageVersion?: string
  agentId?: string
  timezone?: string
  recurrence?: Partial<ScheduleFormData['recurrence']>
}

interface CreateEditModalProps {
  readonly isOpen: boolean
  readonly onClose: (shouldRefresh?: boolean) => void
  readonly mode: 'create' | 'edit'
  readonly editingSchedule?: ScheduleData | null
  readonly onSuccess?: (schedule?: { id: string; name: string }) => void
}

export function CreateEditModal({
  isOpen,
  onClose,
  mode,
  editingSchedule,
  onSuccess,
}: CreateEditModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('trigger')

  // ✅ Initialize form with editing data (reset via key prop in parent)
  const [formData, setFormData] = useState<ScheduleFormData>({
    name: editingSchedule?.name ?? '',
    packageId: editingSchedule?.packageId ?? '',
    packageVersion: editingSchedule?.packageVersion ?? 'latest',
    agentId: editingSchedule?.agentId ?? '',
    timezone: editingSchedule?.timezone ?? 'Asia/Ho_Chi_Minh',
    recurrence: {
      type: (editingSchedule?.recurrence?.type as RecurrenceType) ?? RecurrenceType.Daily,
      value: editingSchedule?.recurrence?.value ?? '1',
      startDate: editingSchedule?.recurrence?.startDate ?? new Date(),
      endDate: editingSchedule?.recurrence?.endDate,
      startTime: editingSchedule?.recurrence?.startTime ?? '09:00',
      dailyHour: editingSchedule?.recurrence?.dailyHour ?? '09',
      dailyMinute: editingSchedule?.recurrence?.dailyMinute ?? '00',
      weeklyHour: editingSchedule?.recurrence?.weeklyHour ?? '09',
      weeklyMinute: editingSchedule?.recurrence?.weeklyMinute ?? '00',
      selectedDays: editingSchedule?.recurrence?.selectedDays ?? [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
      ],
      monthlyHour: editingSchedule?.recurrence?.monthlyHour ?? '09',
      monthlyMinute: editingSchedule?.recurrence?.monthlyMinute ?? '00',
      monthlyOnType: editingSchedule?.recurrence?.monthlyOnType ?? 'day',
      selectedDay: editingSchedule?.recurrence?.selectedDay ?? '1',
      selectedOrdinal: editingSchedule?.recurrence?.selectedOrdinal ?? '1st',
      selectedWeekday: editingSchedule?.recurrence?.selectedWeekday ?? 'Monday',
      selectedMonths: editingSchedule?.recurrence?.selectedMonths ?? [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
    },
  })

  const updateFormData = (updates: Partial<ScheduleFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const updateRecurrence = (updates: Partial<ScheduleFormData['recurrence']>) => {
    setFormData((prev) => ({
      ...prev,
      recurrence: { ...prev.recurrence, ...updates },
    }))
  }

  const validateForm = (): { isValid: boolean; error?: string } => {
    if (!formData.name.trim()) {
      return { isValid: false, error: 'Schedule name is required' }
    }
    if (!formData.packageId) {
      return { isValid: false, error: 'Package selection is required' }
    }
    if (!formData.agentId) {
      return { isValid: false, error: 'Agent selection is required' }
    }
    if (!formData.timezone) {
      return { isValid: false, error: 'Timezone selection is required' }
    }
    return { isValid: true }
  }

  const convertToApiDto = (): CreateScheduleDto => {
    const { recurrence } = formData

    // Convert form data to API DTO format
    let cronExpression: string | undefined
    let oneTimeExecution: string | undefined

    // Generate cron expression or one-time execution date based on recurrence type
    switch (recurrence.type) {
      case RecurrenceType.Once:
        if (recurrence.startDate && recurrence.dailyHour && recurrence.dailyMinute) {
          const date = new Date(recurrence.startDate)
          date.setHours(parseInt(recurrence.dailyHour, 10), parseInt(recurrence.dailyMinute, 10))
          oneTimeExecution = date.toISOString()
        }
        break
      case RecurrenceType.Daily:
        cronExpression = `0 ${recurrence.dailyMinute} ${recurrence.dailyHour} * * *`
        break
      case RecurrenceType.Weekly:
        if (recurrence.selectedDays && recurrence.selectedDays.length > 0) {
          const dayMap: { [key: string]: string } = {
            Sunday: '0',
            Monday: '1',
            Tuesday: '2',
            Wednesday: '3',
            Thursday: '4',
            Friday: '5',
            Saturday: '6',
          }
          const days = recurrence.selectedDays.map((day) => dayMap[day]).join(',')
          cronExpression = `0 ${recurrence.weeklyMinute} ${recurrence.weeklyHour} * * ${days}`
        }
        break
      case RecurrenceType.Monthly:
        if (recurrence.monthlyOnType === 'day' && recurrence.selectedDay) {
          cronExpression = `0 ${recurrence.monthlyMinute} ${recurrence.monthlyHour} ${recurrence.selectedDay} * *`
        }
        break
      case RecurrenceType.Hourly:
        cronExpression = `0 0 */${recurrence.value} * * *`
        break
      case RecurrenceType.Minutes:
        cronExpression = `0 */${recurrence.value} * * * *`
        break
    }

    return {
      name: formData.name.trim(),
      description: '', // Can be added to form later
      isEnabled: true, // Default to enabled
      recurrenceType: recurrence.type,
      cronExpression,
      oneTimeExecution,
      timeZoneId: formData.timezone,
      automationPackageId: formData.packageId,
      botAgentId: formData.agentId,
    }
  }

  const handleSubmit = async () => {
    const validation = validateForm()
    if (!validation.isValid) {
      toast({
        title: 'Validation Error',
        description: validation.error,
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const apiDto = convertToApiDto()

      if (mode === 'edit' && editingSchedule?.id) {
        // ✅ API call in event handler
        const updatedSchedule = await updateSchedule(editingSchedule.id, apiDto)
        toast({
          title: 'Success',
          description: `Schedule "${updatedSchedule.name}" updated successfully`,
        })
        if (onSuccess) onSuccess({ id: updatedSchedule.id, name: updatedSchedule.name })
      } else {
        // ✅ API call in event handler
        const newSchedule = await createSchedule(apiDto)
        toast({
          title: 'Success',
          description: `Schedule "${newSchedule.name}" created successfully`,
        })
        if (onSuccess) onSuccess({ id: newSchedule.id, name: newSchedule.name })
      }

      onClose(true) // ✅ Signal parent to refresh
    } catch (error) {
      console.error(`${mode} schedule failed:`, error)
      toast(createErrorToast(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Schedule' : 'Create Schedule'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <BasicInfoSection formData={formData} onUpdate={updateFormData} />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="trigger">Trigger</TabsTrigger>
              <TabsTrigger value="executionTarget">Execution Target</TabsTrigger>
            </TabsList>

            <TabsContent value="trigger">
              <TriggerTab recurrence={formData.recurrence} onUpdate={updateRecurrence} />
            </TabsContent>

            <TabsContent value="executionTarget">
              <ExecutionTargetTab
                selectedAgentId={formData.agentId}
                onAgentSelect={(agentId) => updateFormData({ agentId })}
              />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ✅ Extracted Basic Info Section Component
interface BasicInfoSectionProps {
  formData: ScheduleFormData
  onUpdate: (updates: Partial<ScheduleFormData>) => void
}

function BasicInfoSection({ formData, onUpdate }: BasicInfoSectionProps) {
  // ✅ SWR for package data fetching
  const {
    data: packages = [],
    error,
    isLoading,
  } = useSWR(swrKeys.packages(), getAllAutomationPackages)

  // ✅ Derive available versions for selected package
  const availableVersions = useMemo(() => {
    if (!formData.packageId) return [{ value: 'latest', label: 'Latest' }]

    const selectedPackage = packages.find(
      (pkg: AutomationPackageResponseDto) => pkg.id === formData.packageId,
    )
    if (!selectedPackage?.versions) return [{ value: 'latest', label: 'Latest' }]

    return [
      { value: 'latest', label: 'Latest' },
      ...selectedPackage.versions.map((version: PackageVersionResponseDto) => ({
        value: version.versionNumber,
        label: `v${version.versionNumber}`,
      })),
    ]
  }, [packages, formData.packageId])

  return (
    <>
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name<span className="text-red-500">*</span>
        </label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Enter schedule name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label htmlFor="package" className="text-sm font-medium">
            Package<span className="text-red-500">*</span>
          </label>
          {isLoading ? (
            <div className="h-10 bg-muted rounded-md animate-pulse" />
          ) : error ? (
            <div className="text-sm text-destructive">Failed to load packages</div>
          ) : (
            <Select
              value={formData.packageId}
              onValueChange={(value) =>
                onUpdate({
                  packageId: value,
                  packageVersion: 'latest', // Reset version when package changes
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg: AutomationPackageResponseDto) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid gap-2">
          <label htmlFor="packageVersion" className="text-sm font-medium">
            Package Version<span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.packageVersion}
            onValueChange={(value) => onUpdate({ packageVersion: value })}
            disabled={!formData.packageId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {availableVersions.map((version: { value: string; label: string }) => (
                <SelectItem key={version.value} value={version.value}>
                  {version.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="timezone" className="text-sm font-medium">
          Time Zone<span className="text-red-500">*</span>
        </label>
        <Select value={formData.timezone} onValueChange={(value) => onUpdate({ timezone: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select time zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Asia/Ho_Chi_Minh">(UTC+7:00) Asia/Ho Chi Minh</SelectItem>
            <SelectItem value="America/New_York">(UTC-5:00) America/New York</SelectItem>
            <SelectItem value="Europe/London">(UTC+0:00) Europe/London</SelectItem>
            <SelectItem value="Asia/Tokyo">(UTC+9:00) Asia/Tokyo</SelectItem>
            <SelectItem value="Australia/Sydney">(UTC+10:00) Australia/Sydney</SelectItem>
            <SelectItem value="UTC">(UTC+0:00) UTC</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )
}
