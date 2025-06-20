'use client'

import { useState } from 'react'
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

// Sub-components
import { TriggerTab } from './components/TriggerTab'
import { ExecutionTargetTab } from './components/ExecutionTargetTab'
import { ParametersTab } from './components/ParametersTab'

// Types
export interface ScheduleFormData {
  name: string
  workflow: string
  timezone: string
  recurrence: {
    type: 'Once' | 'Minutes' | 'Hourly' | 'Daily' | 'Weekly' | 'Monthly'
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
  workflow?: string
  timezone?: string
  recurrence?: Partial<ScheduleFormData['recurrence']>
}

interface CreateEditModalProps {
  isOpen: boolean
  onClose: (shouldRefresh?: boolean) => void
  mode: 'create' | 'edit'
  editingSchedule?: ScheduleData | null
}

export function CreateEditModal({ isOpen, onClose, mode, editingSchedule }: CreateEditModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('trigger')

  // ✅ Initialize form with editing data (reset via key prop in parent)
  const [formData, setFormData] = useState<ScheduleFormData>({
    name: editingSchedule?.name ?? '',
    workflow: editingSchedule?.workflow ?? '',
    timezone: editingSchedule?.timezone ?? 'asia-saigon',
    recurrence: {
      type: editingSchedule?.recurrence?.type ?? 'Minutes',
      value: editingSchedule?.recurrence?.value ?? '1',
      startDate: editingSchedule?.recurrence?.startDate ?? new Date('2025-05-21'),
      endDate: editingSchedule?.recurrence?.endDate,
      startTime: editingSchedule?.recurrence?.startTime ?? '00:00',
      dailyHour: editingSchedule?.recurrence?.dailyHour ?? '00',
      dailyMinute: editingSchedule?.recurrence?.dailyMinute ?? '00',
      weeklyHour: editingSchedule?.recurrence?.weeklyHour ?? '17',
      weeklyMinute: editingSchedule?.recurrence?.weeklyMinute ?? '00',
      selectedDays: editingSchedule?.recurrence?.selectedDays ?? ['Tuesday', 'Thursday', 'Friday'],
      monthlyHour: editingSchedule?.recurrence?.monthlyHour ?? '00',
      monthlyMinute: editingSchedule?.recurrence?.monthlyMinute ?? '00',
      monthlyOnType: editingSchedule?.recurrence?.monthlyOnType ?? 'day',
      selectedDay: editingSchedule?.recurrence?.selectedDay ?? '31',
      selectedOrdinal: editingSchedule?.recurrence?.selectedOrdinal ?? '2nd',
      selectedWeekday: editingSchedule?.recurrence?.selectedWeekday ?? 'Wednesday',
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

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // TODO: Replace with actual API call
      if (mode === 'edit') {
        // await schedulesApi.update(editingSchedule.id, formData)
        toast({ title: 'Success', description: 'Schedule updated successfully' })
      } else {
        // await schedulesApi.create(formData)
        toast({ title: 'Success', description: 'Schedule created successfully' })
      }
      onClose(true) // ✅ Signal parent to refresh
    } catch {
      toast({
        title: 'Error',
        description: `Failed to ${mode} schedule`,
        variant: 'destructive',
      })
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
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="trigger">Trigger</TabsTrigger>
              <TabsTrigger value="executionTarget">Execution Target</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
            </TabsList>

            <TabsContent value="trigger">
              <TriggerTab recurrence={formData.recurrence} onUpdate={updateRecurrence} />
            </TabsContent>

            <TabsContent value="executionTarget">
              <ExecutionTargetTab />
            </TabsContent>

            <TabsContent value="parameters">
              <ParametersTab />
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

      <div className="grid gap-2">
        <label htmlFor="workflow" className="text-sm font-medium">
          Workflow<span className="text-red-500">*</span>
        </label>
        <Select value={formData.workflow} onValueChange={(value) => onUpdate({ workflow: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Choose workflow" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="workflow1">Workflow 1</SelectItem>
            <SelectItem value="workflow2">Workflow 2</SelectItem>
            <SelectItem value="workflow3">Workflow 3</SelectItem>
          </SelectContent>
        </Select>
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
            <SelectItem value="asia-saigon">(UTC+7:00) Asia/Saigon</SelectItem>
            <SelectItem value="america-new_york">(UTC-5:00) America/New_York</SelectItem>
            <SelectItem value="europe-london">(UTC+0:00) Europe/London</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )
}
