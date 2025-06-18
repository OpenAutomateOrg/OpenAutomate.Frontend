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
import { Checkbox } from '@/components/ui/checkbox'

import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDownIcon, Search } from 'lucide-react'
import { ChevronsUpDownIcon as ChevronUpDown } from 'lucide-react'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
}

export function CreateEditModal({ isOpen, onClose, mode }: ItemModalProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date('2025-05-21'))
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [recurrenceType, setRecurrenceType] = useState('Minutes')
  const [recurrenceValue, setRecurrenceValue] = useState('1')
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [startTime, setStartTime] = useState('00:00')
  const [dailyHour, setDailyHour] = useState('00')
  const [dailyMinute, setDailyMinute] = useState('00')
  const [weeklyHour, setWeeklyHour] = useState('17')
  const [weeklyMinute, setWeeklyMinute] = useState('00')
  const [selectedDays, setSelectedDays] = useState<string[]>(['Tuesday', 'Thursday', 'Friday'])
  const [monthlyHour, setMonthlyHour] = useState('00')
  const [monthlyMinute, setMonthlyMinute] = useState('00')
  const [monthlyOnType, setMonthlyOnType] = useState<'day' | 'the'>('day')
  const [selectedDay, setSelectedDay] = useState('31')
  const [selectedOrdinal, setSelectedOrdinal] = useState('2nd')
  const [selectedWeekday, setSelectedWeekday] = useState('Wednesday')
  const [selectedMonths, setSelectedMonths] = useState<string[]>([
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
  ])
  const isEditing = mode === 'edit'

  const resetForm = () => {}

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit ' : 'Create '}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name<span className="text-red-500">*</span>
              </label>
              <Input id="name" />
            </div>

            <div className="grid gap-2">
              <label htmlFor="workflow" className="text-sm font-medium">
                Workflow<span className="text-red-500">*</span>
              </label>
              <Select>
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
              <Select defaultValue="asia-saigon">
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

            <Tabs defaultValue="trigger" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger
                  value="trigger"
                  className="border-b-2 border-red-500 data-[state=active]:border-b-2"
                >
                  Trigger
                </TabsTrigger>
                <TabsTrigger value="executionTarget">ExecutionTarget</TabsTrigger>
                <TabsTrigger value="parameters">Parameters</TabsTrigger>
              </TabsList>

              <TabsContent value="trigger" className="space-y-4">
                <div className="grid gap-2">
                  <label htmlFor="recurrence" className="text-sm font-medium">
                    Recurrence<span className="text-red-500">*</span>
                  </label>
                  <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Once">Once</SelectItem>
                      <SelectItem value="Minutes">Minutes</SelectItem>
                      <SelectItem value="Hourly">Hourly</SelectItem>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recurrenceType === 'Once' ? (
                  // Once - Show only Start Date and Time
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <label htmlFor="startDate" className="text-sm font-medium">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="startDate"
                            className="w-full justify-between font-normal"
                          >
                            {startDate ? startDate.toLocaleDateString() : 'Select date'}
                            <ChevronDownIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            captionLayout="dropdown"
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            onSelect={(date) => {
                              setStartDate(date)
                              setStartDateOpen(false)
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm">At</span>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </div>
                ) : recurrenceType === 'Daily' ? (
                  // Daily - Show Start Date, End Date, and Time
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label htmlFor="startDate" className="text-sm font-medium">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id="startDate"
                              className="w-full justify-between font-normal"
                            >
                              {startDate ? startDate.toLocaleDateString() : 'Select date'}
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              captionLayout="dropdown"
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              onSelect={(date) => {
                                setStartDate(date)
                                setStartDateOpen(false)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="grid gap-2">
                        <label htmlFor="endDate" className="text-sm font-medium">
                          End Date
                        </label>
                        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id="endDate"
                              className="w-full justify-between font-normal"
                            >
                              {endDate ? endDate.toLocaleDateString() : 'Select date'}
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              captionLayout="dropdown"
                              disabled={(date) => {
                                const today = new Date(new Date().setHours(0, 0, 0, 0))
                                const minDate = startDate ? new Date(startDate) : today
                                return date < minDate
                              }}
                              onSelect={(date) => {
                                setEndDate(date)
                                setEndDateOpen(false)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm">At:</span>
                      <Select value={dailyHour} onValueChange={setDailyHour}>
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
                      <Select value={dailyMinute} onValueChange={setDailyMinute}>
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

                    {startDate && endDate && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">i</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-900">
                              When will the sessions start?
                            </p>
                            <div className="text-sm text-blue-800 space-y-1">
                              <p>
                                The first session will start at {dailyHour}:{dailyMinute}:00{' '}
                                {startDate.toLocaleDateString('en-GB')}
                              </p>
                              <p>
                                The last session will start at {dailyHour}:{dailyMinute}:00{' '}
                                {endDate.toLocaleDateString('en-GB')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : recurrenceType === 'Weekly' ? (
                  // Weekly - Show Start Date, End Date, Time, and Days
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label htmlFor="startDate" className="text-sm font-medium">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id="startDate"
                              className="w-full justify-between font-normal"
                            >
                              {startDate ? startDate.toLocaleDateString() : 'Select date'}
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              captionLayout="dropdown"
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              onSelect={(date) => {
                                setStartDate(date)
                                setStartDateOpen(false)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="grid gap-2">
                        <label htmlFor="endDate" className="text-sm font-medium">
                          End Date
                        </label>
                        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id="endDate"
                              className="w-full justify-between font-normal"
                            >
                              {endDate ? endDate.toLocaleDateString() : 'Select date'}
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              captionLayout="dropdown"
                              disabled={(date) => {
                                const today = new Date(new Date().setHours(0, 0, 0, 0))
                                const minDate = startDate ? new Date(startDate) : today
                                return date < minDate
                              }}
                              onSelect={(date) => {
                                setEndDate(date)
                                setEndDateOpen(false)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm">Every day at:</span>
                      <Select value={weeklyHour} onValueChange={setWeeklyHour}>
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
                      <Select value={weeklyMinute} onValueChange={setWeeklyMinute}>
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

                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-4">
                        {['Monday', 'Tuesday', 'Wednesday'].map((day) => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                              id={day}
                              checked={selectedDays.includes(day)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDays([...selectedDays, day])
                                } else {
                                  setSelectedDays(selectedDays.filter((d) => d !== day))
                                }
                              }}
                            />
                            <label htmlFor={day} className="text-sm font-medium">
                              {day}
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {['Thursday', 'Friday', 'Saturday'].map((day) => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                              id={day}
                              checked={selectedDays.includes(day)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDays([...selectedDays, day])
                                } else {
                                  setSelectedDays(selectedDays.filter((d) => d !== day))
                                }
                              }}
                            />
                            <label htmlFor={day} className="text-sm font-medium">
                              {day}
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="Sunday"
                            checked={selectedDays.includes('Sunday')}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDays([...selectedDays, 'Sunday'])
                              } else {
                                setSelectedDays(selectedDays.filter((d) => d !== 'Sunday'))
                              }
                            }}
                          />
                          <label htmlFor="Sunday" className="text-sm font-medium">
                            Sunday
                          </label>
                        </div>
                      </div>
                    </div>

                    {startDate &&
                      endDate &&
                      selectedDays.length > 0 &&
                      (() => {
                        // Validation: Check if selected days occur between start and end dates
                        const days = [
                          'Sunday',
                          'Monday',
                          'Tuesday',
                          'Wednesday',
                          'Thursday',
                          'Friday',
                          'Saturday',
                        ]
                        const selectedDayIndices = selectedDays.map((day) => days.indexOf(day))

                        // Get all days between start and end date
                        const daysBetween: number[] = []
                        const current = new Date(startDate)
                        const end = new Date(endDate)

                        while (current <= end) {
                          daysBetween.push(current.getDay())
                          current.setDate(current.getDate() + 1)
                        }

                        // Check if any selected day occurs in the date range
                        const hasValidDays = selectedDayIndices.some((dayIndex) =>
                          daysBetween.includes(dayIndex),
                        )

                        return !hasValidDays
                      })() && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <p className="text-sm text-red-700">
                            Invalid Input. The given trigger will never fire!
                          </p>
                        </div>
                      )}

                    {startDate &&
                      endDate &&
                      selectedDays.length > 0 &&
                      (() => {
                        // Validation: Check if selected days occur between start and end dates
                        const days = [
                          'Sunday',
                          'Monday',
                          'Tuesday',
                          'Wednesday',
                          'Thursday',
                          'Friday',
                          'Saturday',
                        ]
                        const selectedDayIndices = selectedDays.map((day) => days.indexOf(day))

                        // Get all days between start and end date
                        const daysBetween: number[] = []
                        const current = new Date(startDate)
                        const end = new Date(endDate)

                        while (current <= end) {
                          daysBetween.push(current.getDay())
                          current.setDate(current.getDate() + 1)
                        }

                        // Check if any selected day occurs in the date range
                        const hasValidDays = selectedDayIndices.some((dayIndex) =>
                          daysBetween.includes(dayIndex),
                        )

                        return hasValidDays
                      })() && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">i</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-blue-900">
                                When will the sessions start?
                              </p>
                              <div className="text-sm text-blue-800 space-y-1">
                                <p>
                                  The first session will start at {weeklyHour}:{weeklyMinute}:00{' '}
                                  {startDate.toLocaleDateString('en-GB')}
                                </p>
                                <p>
                                  {(() => {
                                    // Calculate next occurrence based on selected days within date range
                                    const days = [
                                      'Sunday',
                                      'Monday',
                                      'Tuesday',
                                      'Wednesday',
                                      'Thursday',
                                      'Friday',
                                      'Saturday',
                                    ]
                                    const selectedDayIndices = selectedDays.map((day) =>
                                      days.indexOf(day),
                                    )

                                    // Find next occurrence after start date but within end date
                                    let nextOccurrence = null
                                    const currentDate = new Date(startDate)
                                    const endOfRange = new Date(endDate)

                                    // Start checking from the day after start date
                                    currentDate.setDate(currentDate.getDate() + 1)

                                    while (currentDate <= endOfRange) {
                                      if (selectedDayIndices.includes(currentDate.getDay())) {
                                        nextOccurrence = new Date(currentDate)
                                        break
                                      }
                                      currentDate.setDate(currentDate.getDate() + 1)
                                    }

                                    if (nextOccurrence) {
                                      return `The second session will start at ${weeklyHour}:${weeklyMinute}:00 ${nextOccurrence.toLocaleDateString('en-GB')}`
                                    } else {
                                      return 'No additional sessions within the selected date range'
                                    }
                                  })()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                ) : recurrenceType === 'Monthly' ? (
                  // Monthly - Show Start Date, End Date, Time, and Monthly Options
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label htmlFor="startDate" className="text-sm font-medium">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id="startDate"
                              className="w-full justify-between font-normal"
                            >
                              {startDate ? startDate.toLocaleDateString() : 'Select date'}
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              captionLayout="dropdown"
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              onSelect={(date) => {
                                setStartDate(date)
                                setStartDateOpen(false)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="grid gap-2">
                        <label htmlFor="endDate" className="text-sm font-medium">
                          End Date
                        </label>
                        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id="endDate"
                              className="w-full justify-between font-normal"
                            >
                              {endDate ? endDate.toLocaleDateString() : 'Select date'}
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              captionLayout="dropdown"
                              disabled={(date) => {
                                const today = new Date(new Date().setHours(0, 0, 0, 0))
                                const minDate = startDate ? new Date(startDate) : today
                                return date < minDate
                              }}
                              onSelect={(date) => {
                                setEndDate(date)
                                setEndDateOpen(false)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm">At:</span>
                      <Select value={monthlyHour} onValueChange={setMonthlyHour}>
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
                      <Select value={monthlyMinute} onValueChange={setMonthlyMinute}>
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

                    <div className="space-y-3">
                      <span className="text-sm font-medium">On:</span>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center cursor-pointer ${
                                monthlyOnType === 'day'
                                  ? 'bg-red-500'
                                  : 'border-2 border-gray-300 bg-white'
                              }`}
                              onClick={() => setMonthlyOnType('day')}
                            >
                              <input
                                type="radio"
                                id="day-option"
                                name="monthly-on"
                                className="sr-only"
                                checked={monthlyOnType === 'day'}
                                onChange={() => setMonthlyOnType('day')}
                              />
                              {monthlyOnType === 'day' && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                            <label
                              htmlFor="day-option"
                              className="text-sm font-medium cursor-pointer"
                            >
                              Day
                            </label>
                          </div>
                          <Select
                            value={selectedDay}
                            onValueChange={setSelectedDay}
                            disabled={monthlyOnType !== 'day'}
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
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center cursor-pointer ${
                                monthlyOnType === 'the'
                                  ? 'bg-red-500'
                                  : 'border-2 border-gray-300 bg-white'
                              }`}
                              onClick={() => setMonthlyOnType('the')}
                            >
                              <input
                                type="radio"
                                id="the-option"
                                name="monthly-on"
                                className="sr-only"
                                checked={monthlyOnType === 'the'}
                                onChange={() => setMonthlyOnType('the')}
                              />
                              {monthlyOnType === 'the' && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                            <label
                              htmlFor="the-option"
                              className="text-sm font-medium cursor-pointer"
                            >
                              The
                            </label>
                          </div>
                          <Select
                            value={selectedOrdinal}
                            onValueChange={setSelectedOrdinal}
                            disabled={monthlyOnType !== 'the'}
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
                            value={selectedWeekday}
                            onValueChange={setSelectedWeekday}
                            disabled={monthlyOnType !== 'the'}
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

                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-4">
                        {['January', 'February', 'March'].map((month) => (
                          <div key={month} className="flex items-center space-x-2">
                            <Checkbox
                              id={month}
                              checked={selectedMonths.includes(month)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedMonths([...selectedMonths, month])
                                } else {
                                  setSelectedMonths(selectedMonths.filter((m) => m !== month))
                                }
                              }}
                            />
                            <label htmlFor={month} className="text-sm font-medium">
                              {month}
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {['April', 'May', 'June'].map((month) => (
                          <div key={month} className="flex items-center space-x-2">
                            <Checkbox
                              id={month}
                              checked={selectedMonths.includes(month)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedMonths([...selectedMonths, month])
                                } else {
                                  setSelectedMonths(selectedMonths.filter((m) => m !== month))
                                }
                              }}
                            />
                            <label htmlFor={month} className="text-sm font-medium">
                              {month}
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {['July', 'August', 'September'].map((month) => (
                          <div key={month} className="flex items-center space-x-2">
                            <Checkbox
                              id={month}
                              checked={selectedMonths.includes(month)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedMonths([...selectedMonths, month])
                                } else {
                                  setSelectedMonths(selectedMonths.filter((m) => m !== month))
                                }
                              }}
                            />
                            <label htmlFor={month} className="text-sm font-medium">
                              {month}
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {['October', 'November', 'December'].map((month) => (
                          <div key={month} className="flex items-center space-x-2">
                            <Checkbox
                              id={month}
                              checked={selectedMonths.includes(month)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedMonths([...selectedMonths, month])
                                } else {
                                  setSelectedMonths(selectedMonths.filter((m) => m !== month))
                                }
                              }}
                            />
                            <label htmlFor={month} className="text-sm font-medium">
                              {month}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {startDate &&
                      endDate &&
                      selectedMonths.length > 0 &&
                      (() => {
                        // Validation for Monthly recurrence
                        return true // For now, show info panel when basic conditions are met
                      })() && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">i</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-blue-900">
                                When will the sessions start?
                              </p>
                              <div className="text-sm text-blue-800 space-y-1">
                                <p>
                                  The first session will start at {monthlyHour}:{monthlyMinute}:00{' '}
                                  {startDate.toLocaleDateString('en-GB')}
                                </p>
                                <p>
                                  The second session will start at {monthlyHour}:{monthlyMinute}:00{' '}
                                  {(() => {
                                    // Calculate next monthly occurrence
                                    const nextMonth = new Date(startDate)
                                    nextMonth.setMonth(nextMonth.getMonth() + 1)
                                    return nextMonth.toLocaleDateString('en-GB')
                                  })()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  // Recurring - Show Start Date, End Date, and Interval
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label htmlFor="startDate" className="text-sm font-medium">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id="startDate"
                              className="w-full justify-between font-normal"
                            >
                              {startDate ? startDate.toLocaleDateString() : 'Select date'}
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              captionLayout="dropdown"
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              onSelect={(date) => {
                                setStartDate(date)
                                setStartDateOpen(false)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="grid gap-2">
                        <label htmlFor="endDate" className="text-sm font-medium">
                          End Date
                        </label>
                        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id="endDate"
                              className="w-full justify-between font-normal"
                            >
                              {endDate ? endDate.toLocaleDateString() : 'Select date'}
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              captionLayout="dropdown"
                              disabled={(date) => {
                                const today = new Date(new Date().setHours(0, 0, 0, 0))
                                const minDate = startDate ? new Date(startDate) : today
                                return date < minDate
                              }}
                              onSelect={(date) => {
                                setEndDate(date)
                                setEndDateOpen(false)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm">Every</span>
                      <Select value={recurrenceValue} onValueChange={setRecurrenceValue}>
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
                        {recurrenceType === 'Hourly' ? 'Hours' : 'minute(s)'}
                      </span>
                    </div>

                    {(recurrenceType === 'Minutes' || recurrenceType === 'Hourly') && startDate && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">i</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-900">
                              When will the sessions start?
                            </p>
                            <div className="text-sm text-blue-800 space-y-1">
                              <p>
                                The first session will start at{' '}
                                {(() => {
                                  const now = new Date()
                                  const hours = now.getHours().toString().padStart(2, '0')
                                  const minutes = now.getMinutes().toString().padStart(2, '0')
                                  const currentTime = `${hours}:${minutes}:00`
                                  return `${currentTime} ${startDate.toLocaleDateString('en-GB')}`
                                })()}
                              </p>
                              <p>
                                The second session will start at{' '}
                                {(() => {
                                  const now = new Date()
                                  let nextSession
                                  if (recurrenceType === 'Minutes') {
                                    nextSession = new Date(
                                      now.getTime() + parseInt(recurrenceValue) * 60000,
                                    )
                                  } else if (recurrenceType === 'Hourly') {
                                    nextSession = new Date(
                                      now.getTime() + parseInt(recurrenceValue) * 60 * 60000,
                                    )
                                  }
                                  if (nextSession) {
                                    const hours = nextSession.getHours().toString().padStart(2, '0')
                                    const minutes = nextSession
                                      .getMinutes()
                                      .toString()
                                      .padStart(2, '0')
                                    const nextTime = `${hours}:${minutes}:00`
                                    return `${nextTime} ${startDate.toLocaleDateString('en-GB')}`
                                  }
                                  return ''
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="executionTarget">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search" className="pl-8" />
                  </div>
                  <div className="border rounded-md">
                    <div className="bg-muted/50 grid grid-cols-3 py-2 px-4">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span>Name</span>
                        <ChevronUpDown className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span>Machine name</span>
                        <ChevronUpDown className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span>Status</span>
                      </div>
                    </div>
                    <div className="py-8 text-center text-sm text-muted-foreground">No data...</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="parameters">
                <div className="space-y-4">
                  <Button>Add</Button>
                  <div className="border rounded-md">
                    <div className="bg-muted/50 grid grid-cols-3 py-2 px-4">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span>Name</span>
                        <ChevronUpDown className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span>Machine name</span>
                        <ChevronUpDown className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span>Status</span>
                      </div>
                    </div>
                    <div className="py-8 text-center text-sm text-muted-foreground">No data...</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
