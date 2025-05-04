'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FilterX } from 'lucide-react'

interface FilterOption {
  id: string
  label: string
  options: string[]
}

interface FilterBarProps {
  filterOptions: FilterOption[]
  filters: Record<string, string>
  onFilterChange: (filters: Record<string, string>) => void
}

export function FilterBar({ filterOptions, filters, onFilterChange }: FilterBarProps) {
  const [localFilters, setLocalFilters] = useState<Record<string, string>>(filters)

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Handle filter change
  const handleFilterChange = (id: string, value: string) => {
    const newFilters = {
      ...localFilters,
      [id]: value === 'All' ? '' : value,
    }

    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  // Reset all filters
  const resetFilters = () => {
    const emptyFilters = {}
    setLocalFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {filterOptions.map((option) => (
            <div key={option.id} className="flex items-center gap-2">
              <span className="text-sm font-medium">{option.label}:</span>
              <Select
                value={localFilters[option.id] || 'All'}
                onValueChange={(value) => handleFilterChange(option.id, value)}
              >
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue placeholder={`Select ${option.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {option.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">
            <FilterX className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
