'use client'

import { Input } from '@/components/ui/input'
import { Search, ChevronsUpDown } from 'lucide-react'

export function ExecutionTargetTab() {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search" className="pl-8" />
      </div>

      <div className="border rounded-md">
        <div className="bg-muted/50 grid grid-cols-3 py-2 px-4">
          <div className="flex items-center gap-1 text-sm font-medium">
            <span>Name</span>
            <ChevronsUpDown className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1 text-sm font-medium">
            <span>Machine name</span>
            <ChevronsUpDown className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1 text-sm font-medium">
            <span>Status</span>
          </div>
        </div>

        <div className="py-8 text-center text-sm text-muted-foreground">No data...</div>
      </div>
    </div>
  )
}
