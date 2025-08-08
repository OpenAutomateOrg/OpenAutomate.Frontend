'use client'

import { Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getExecutionsODataTotal } from '@/lib/api/executions'
import { swrKeys } from '@/lib/config/swr-config'
import useSWR from 'swr'
import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

// Helper function to get status-specific colors
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Running':
      return 'border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700'
    case 'Pending':
      return 'border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700'
    case 'Completed':
      return 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
    case 'Failed':
      return 'border-red-500 text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300 dark:border-red-700'
    default:
      return 'border-gray-500 text-gray-700 bg-gray-50 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-700'
  }
}

export function StatisticalStatus() {
  const pathname = usePathname()
  const tenant = pathname.split('/')[1]
  // Fetch executions data for status counting
  const { data: executionsResponse } = useSWR(swrKeys.executionsODataTotal(tenant), () =>
    getExecutionsODataTotal(tenant),
  )
  // Count executions by status
  const jobStatuses = useMemo(() => {
    if (!executionsResponse?.value) {
      return [
        { label: 'Running', count: 0 },
        { label: 'Pending', count: 0 },
        { label: 'Completed', count: 0 },
        { label: 'Failed', count: 0 },
      ]
    }

    const executions = executionsResponse.value
    const statusCounts = {
      Running: 0,
      Pending: 0,
      Completed: 0,
      Failed: 0,
    }

    // Count each status
    executions.forEach((execution) => {
      const status = execution.status
      if (status === 'Running') {
        statusCounts.Running++
      } else if (status === 'Pending') {
        statusCounts.Pending++
      } else if (status === 'Completed') {
        statusCounts.Completed++
      } else if (status === 'Failed') {
        statusCounts.Failed++
      }
    })

    return [
      { label: 'Running', count: statusCounts.Running },
      { label: 'Pending', count: statusCounts.Pending },
      { label: 'Completed', count: statusCounts.Completed },
      { label: 'Failed', count: statusCounts.Failed },
    ]
  }, [executionsResponse])

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-white   dark:*:data-[slot=card]:bg-neutral-900">
      <Card className="flex flex-col h-full flex-1">
        <CardHeader className="items-center pb-4">
          <CardTitle className="flex items-center justify-between text-lg font-medium w-full">
            <span>Execution Status</span>
            <Info className="w-5 h-5 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-4 ">
          <div className="grid grid-cols-2 gap-3">
            {jobStatuses.map((status) => (
              <Card
                key={status.label}
                className={`border-0 shadow-sm hover:shadow-md transition-shadow duration-200 ${getStatusColor(status.label)}`}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center space-y-3">
                  <div className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ">
                    {status.label}
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {status.count.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {status.label.toLowerCase()} jobs
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
