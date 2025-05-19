'use client'

import type React from 'react'

import { useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSearchContext } from './search-context'

export function SearchBar() {
  const { setSearchTerm } = useSearchContext()
  const [selectedValue, setSelectedValue] = useState('')

  const handleFilter = () => {
    setSearchTerm(selectedValue)
  }

  const handleClear = () => {
    setSelectedValue('')
    setSearchTerm('')
  }

  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative flex-1">
        <ArrowDown className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <select
          className="w-full appearance-none rounded-md border border-input hover:border-orange-600 py-2 pl-8 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={selectedValue}
          onChange={(e) => setSelectedValue(e.target.value)}
        >
          <option value="">Select agent</option>
          <option value="bar">Agent 1</option>
          <option value="line">Agent 2</option>
          <option value="pie">Agent 3</option>
        </select>
      </div>
      <Button onClick={handleFilter} size="sm">
        Filter
      </Button>
      {selectedValue && (
        <Button onClick={handleClear} variant="outline" size="sm">
          Clear
        </Button>
      )}
    </div>
  )
}
