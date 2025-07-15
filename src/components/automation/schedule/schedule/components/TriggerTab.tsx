'use client'

import { useState } from 'react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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

  const updateMonthSelection = (month: string, checked: boolean) => {
    const currentMonths = recurrence.selectedMonths ?? []
    if (checked) {
      onUpdate({ selectedMonths: [...currentMonths, month] })
    } else {
      onUpdate({ selectedMonths: currentMonths.filter((m) => m !== month) })
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
            <SelectItem value={RecurrenceType.Monthly}>Monthly</SelectItem>
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

      {recurrence.type === RecurrenceType.Monthly && (
        <MonthlyConfiguration
          recurrence={recurrence}
          onUpdate={onUpdate}
          updateMonthSelection={updateMonthSelection}
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

function DailyConfiguration({
  recurrence,
  onUpdate
}: ConfigurationProps) {
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

function WeeklyConfiguration({
  recurrence,
  onUpdate,
  updateDaySelection
}: ConfigurationProps) {
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

function MonthlyConfiguration({
  recurrence,
  onUpdate,
  updateMonthSelection
}: ConfigurationProps) {
  const months = [
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
  ]
  const selectedMonths = recurrence.selectedMonths ?? []

  return (
    <div className="space-y-4">
      <TimeSelector
        label="At:"
        hour={recurrence.monthlyHour ?? '00'}
        minute={recurrence.monthlyMinute ?? '00'}
        onHourChange={(hour) => onUpdate({ monthlyHour: hour })}
        onMinuteChange={(minute) => onUpdate({ monthlyMinute: minute })}
      />

      <MonthlyOptions recurrence={recurrence} onUpdate={onUpdate} />

      <MonthSelector
        months={months}
        selectedMonths={selectedMonths}
        onMonthToggle={updateMonthSelection!}
      />
    </div>
  )
}

function RecurringConfiguration({
  recurrence,
  onUpdate
}: ConfigurationProps) {
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
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal">
            {date ? date.toLocaleDateString() : 'Select date'}
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
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
        </PopoverContent>
      </Popover>
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

interface MonthSelectorProps {
  months: string[]
  selectedMonths: string[]
  onMonthToggle: (month: string, checked: boolean) => void
}

function MonthSelector({ months, selectedMonths, onMonthToggle }: MonthSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-4">
        {months.map((month) => (
          <div key={month} className="flex items-center space-x-2">
            <Checkbox
              id={month}
              checked={selectedMonths.includes(month)}
              onCheckedChange={(checked) => onMonthToggle(month, !!checked)}
            />
            <label htmlFor={month} className="text-sm font-medium">
              {month}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

interface MonthlyOptionsProps {
  recurrence: ScheduleFormData['recurrence']
  onUpdate: (updates: Partial<ScheduleFormData['recurrence']>) => void
}

function MonthlyOptions({ recurrence, onUpdate }: MonthlyOptionsProps) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">On:</span>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="day-option"
              name="monthly-on"
              checked={recurrence.monthlyOnType === 'day'}
              onChange={() => onUpdate({ monthlyOnType: 'day' })}
            />
            <label htmlFor="day-option" className="text-sm font-medium">
              Day
            </label>
          </div>
          <Select
            value={recurrence.selectedDay ?? '31'}
            onValueChange={(value) => onUpdate({ selectedDay: value })}
            disabled={recurrence.monthlyOnType !== 'day'}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="the-option"
              name="monthly-on"
              checked={recurrence.monthlyOnType === 'the'}
              onChange={() => onUpdate({ monthlyOnType: 'the' })}
            />
            <label htmlFor="the-option" className="text-sm font-medium">
              The
            </label>
          </div>
          <Select
            value={recurrence.selectedOrdinal ?? '2nd'}
            onValueChange={(value) => onUpdate({ selectedOrdinal: value })}
            disabled={recurrence.monthlyOnType !== 'the'}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1st">1st</SelectItem>
              <SelectItem value="2nd">2nd</SelectItem>
              <SelectItem value="3rd">3rd</SelectItem>
              <SelectItem value="4th">4th</SelectItem>
              <SelectItem value="5th">5th</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={recurrence.selectedWeekday ?? 'Wednesday'}
            onValueChange={(value) => onUpdate({ selectedWeekday: value })}
            disabled={recurrence.monthlyOnType !== 'the'}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Monday">Monday</SelectItem>
              <SelectItem value="Tuesday">Tuesday</SelectItem>
              <SelectItem value="Wednesday">Wednesday</SelectItem>
              <SelectItem value="Thursday">Thursday</SelectItem>
              <SelectItem value="Friday">Friday</SelectItem>
              <SelectItem value="Saturday">Saturday</SelectItem>
              <SelectItem value="Sunday">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
