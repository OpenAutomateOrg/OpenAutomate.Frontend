'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { ChevronDownIcon } from 'lucide-react'
import { RecurrenceType } from '@/lib/api/schedules'
import type { ScheduleFormData } from '../create-edit-modal'

interface TriggerTabProps {
  recurrence: ScheduleFormData['recurrence']
  onUpdate: (updates: Partial<ScheduleFormData['recurrence']>) => void
}

export function TriggerTab({ recurrence, onUpdate }: TriggerTabProps) {
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  const updateDaySelection = (day: string, checked: boolean) => {
    const currentDays = recurrence.selectedDays ?? []
    if (checked) {
      onUpdate({ selectedDays: [...currentDays, day] })
    } else {
      onUpdate({ selectedDays: currentDays.filter((d) => d !== day) })
    }
  }



  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <label htmlFor="recurrence" className="text-sm font-medium">
          Recurrence<span className="text-red-500">*</span>
        </label>
        <Select
          value={recurrence.type}
          onValueChange={(value: RecurrenceType) => onUpdate({ type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={RecurrenceType.Once}>Once</SelectItem>
            <SelectItem value={RecurrenceType.Minutes}>Minutes</SelectItem>
            <SelectItem value={RecurrenceType.Hourly}>Hourly</SelectItem>
            <SelectItem value={RecurrenceType.Daily}>Daily</SelectItem>
            <SelectItem value={RecurrenceType.Weekly}>Weekly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {recurrence.type === RecurrenceType.Once && (
        <OnceConfiguration
          recurrence={recurrence}
          onUpdate={onUpdate}
          startDateOpen={startDateOpen}
          setStartDateOpen={setStartDateOpen}
        />
      )}

      {recurrence.type === RecurrenceType.Daily && (
        <DailyConfiguration
          recurrence={recurrence}
          onUpdate={onUpdate}
          startDateOpen={startDateOpen}
          setStartDateOpen={setStartDateOpen}
          endDateOpen={endDateOpen}
          setEndDateOpen={setEndDateOpen}
        />
      )}

      {recurrence.type === RecurrenceType.Weekly && (
        <WeeklyConfiguration
          recurrence={recurrence}
          onUpdate={onUpdate}
          updateDaySelection={updateDaySelection}
          startDateOpen={startDateOpen}
          setStartDateOpen={setStartDateOpen}
          endDateOpen={endDateOpen}
          setEndDateOpen={setEndDateOpen}
        />
      )}



      {(recurrence.type === RecurrenceType.Minutes ||
        recurrence.type === RecurrenceType.Hourly) && (
        <RecurringConfiguration
          recurrence={recurrence}
          onUpdate={onUpdate}
          startDateOpen={startDateOpen}
          setStartDateOpen={setStartDateOpen}
          endDateOpen={endDateOpen}
          setEndDateOpen={setEndDateOpen}
        />
      )}
    </div>
  )
}

// ✅ Extracted Once Configuration Component
interface ConfigurationProps {
  recurrence: ScheduleFormData['recurrence']
  onUpdate: (updates: Partial<ScheduleFormData['recurrence']>) => void
  startDateOpen: boolean
  setStartDateOpen: (open: boolean) => void
  endDateOpen?: boolean
  setEndDateOpen?: (open: boolean) => void
  updateDaySelection?: (day: string, checked: boolean) => void
  updateMonthSelection?: (month: string, checked: boolean) => void
}

function OnceConfiguration({
  recurrence,
  onUpdate,
  startDateOpen,
  setStartDateOpen,
}: ConfigurationProps) {
  return (
    <div className="space-y-4">
      <DatePicker
        label="Start Date"
        required
        date={recurrence.startDate}
        onDateChange={(date) => onUpdate({ startDate: date })}
        isOpen={startDateOpen}
        setIsOpen={setStartDateOpen}
      />
      <TimeSelector
        label="At:"
        hour={recurrence.dailyHour ?? '09'}
        minute={recurrence.dailyMinute ?? '00'}
        onHourChange={(hour) => onUpdate({ dailyHour: hour })}
        onMinuteChange={(minute) => onUpdate({ dailyMinute: minute })}
      />
    </div>
  )
}

function DailyConfiguration({ recurrence, onUpdate }: ConfigurationProps) {
  return (
    <div className="space-y-4">
      <TimeSelector
        label="At:"
        hour={recurrence.dailyHour ?? '09'}
        minute={recurrence.dailyMinute ?? '00'}
        onHourChange={(hour) => onUpdate({ dailyHour: hour })}
        onMinuteChange={(minute) => onUpdate({ dailyMinute: minute })}
      />
    </div>
  )
}

function WeeklyConfiguration({ recurrence, onUpdate, updateDaySelection }: ConfigurationProps) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const selectedDays = recurrence.selectedDays ?? []

  return (
    <div className="space-y-4">
      <TimeSelector
        label="Every day at:"
        hour={recurrence.weeklyHour ?? '17'}
        minute={recurrence.weeklyMinute ?? '00'}
        onHourChange={(hour) => onUpdate({ weeklyHour: hour })}
        onMinuteChange={(minute) => onUpdate({ weeklyMinute: minute })}
      />

      <DaySelector days={days} selectedDays={selectedDays} onDayToggle={updateDaySelection!} />
    </div>
  )
}



function RecurringConfiguration({ recurrence, onUpdate }: ConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">Every</span>
        <Select value={recurrence.value} onValueChange={(value) => onUpdate({ value })}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="15">15</SelectItem>
            <SelectItem value="30">30</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm">
          {recurrence.type === RecurrenceType.Hourly ? 'Hours' : 'minute(s)'}
        </span>
      </div>
    </div>
  )
}

// ✅ Reusable UI Components
interface DatePickerProps {
  label: string
  required?: boolean
  date?: Date
  onDateChange: (date?: Date) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  minDate?: Date
}

function DatePicker({
  label,
  required,
  date,
  onDateChange,
  isOpen,
  setIsOpen,
  minDate,
}: DatePickerProps) {
  const calendarRef = React.useRef<HTMLDivElement>(null)

  // Handle clicks outside the calendar
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, setIsOpen])

  return (
    <div className="grid gap-2 relative">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Button
        variant="outlineCommon"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {date ? date.toLocaleDateString() : 'Select date'}
        <ChevronDownIcon className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div
          ref={calendarRef}
          className="absolute bottom-full left-0 z-[100] mb-1 bg-popover text-popover-foreground rounded-md border shadow-md"
          style={{ zIndex: 100 }}
        >
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            disabled={(date) => {
              const today = new Date(new Date().setHours(0, 0, 0, 0))
              const min = minDate ? new Date(minDate) : today
              return date < min
            }}
            onSelect={(date) => {
              onDateChange(date || undefined)
              setIsOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

interface TimeSelectorProps {
  label: string
  hour: string
  minute: string
  onHourChange: (hour: string) => void
  onMinuteChange: (minute: string) => void
}

function TimeSelector({ label, hour, minute, onHourChange, onMinuteChange }: TimeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{label}</span>
      <Select value={hour} onValueChange={onHourChange}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 24 }, (_, i) => (
            <SelectItem key={i} value={i.toString().padStart(2, '0')}>
              {i.toString().padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm">:</span>
      <Select value={minute} onValueChange={onMinuteChange}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 60 }, (_, i) => (
            <SelectItem key={i} value={i.toString().padStart(2, '0')}>
              {i.toString().padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface DaySelectorProps {
  days: string[]
  selectedDays: string[]
  onDayToggle: (day: string, checked: boolean) => void
}

function DaySelector({ days, selectedDays, onDayToggle }: DaySelectorProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-4">
        {days.map((day) => (
          <div key={day} className="flex items-center space-x-2">
            <Checkbox
              id={day}
              checked={selectedDays.includes(day)}
              onCheckedChange={(checked) => onDayToggle(day, !!checked)}
            />
            <label htmlFor={day} className="text-sm font-medium">
              {day}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}




