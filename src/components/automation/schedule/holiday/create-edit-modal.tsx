'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
}

export function CreateEditModal({ isOpen, onClose, mode }: ItemModalProps) {
  const [isLoading] = useState(false)
  const [holidayName, setHolidayName] = useState('')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: undefined,
    to: undefined,
  })

  const isEditing = mode === 'edit'

  const handleSubmit = async () => {}

  const resetForm = () => {}

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] p-6">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Agent' : 'Create a new Agent'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="holiday-name">
              Holiday name<span className="text-red-500">*</span>
            </Label>
            <Input
              id="holiday-name"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date-range">
              From date<span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-range"
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal h-10',
                    !dateRange.from && 'text-muted-foreground',
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'MMM dd, yyyy')} -{' '}
                            {format(dateRange.to, 'MMM dd, yyyy')}
                          </>
                        ) : (
                          format(dateRange.from, 'MMM dd, yyyy')
                        )
                      ) : (
                        <span className="text-muted-foreground">Start date</span>
                      )}
                      {!dateRange.to && dateRange.from && ' - End date'}
                    </span>
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range) => {
                    setDateRange({
                      from: range?.from,
                      to: range?.to,
                    })
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>

          <Button onClick={handleSubmit} disabled={isLoading}>
            Add Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
