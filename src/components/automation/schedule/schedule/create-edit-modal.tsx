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
import { CalendarIcon, InfoIcon, Search } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
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
                      <SelectItem value="Minutes">Minutes</SelectItem>
                      <SelectItem value="Hourly">Hourly</SelectItem>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="startDate" className="text-sm font-medium">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !startDate && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'yyyy-MM-dd') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="endDate" className="text-sm font-medium">
                      End Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !endDate && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'yyyy-MM-dd') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
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
                  <span className="text-sm">minute(s)</span>
                </div>

                <div className="bg-blue-50 p-4 rounded-md flex gap-2">
                  <InfoIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p>When will the sessions start?</p>
                    <p>The first session will start at 23:02:00 21/05/2025</p>
                    <p>The second session will start at 23:03:00 21/05/2025</p>
                  </div>
                </div>
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
