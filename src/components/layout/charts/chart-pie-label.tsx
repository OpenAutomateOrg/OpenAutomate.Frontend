'use client'

import { TrendingUp } from 'lucide-react'
import { Pie, PieChart } from 'recharts'
import { getExecutionsODataTotal } from '@/lib/api/executions'
import { swrKeys } from '@/lib/config/swr-config'
import useSWR from 'swr'
import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale } from '@/providers/locale-provider'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig = {
  executions: {
    label: 'Executions',
  },
  running: {
    label: 'Running',
    color: '#3b82f6', // Blue for running
  },
  pending: {
    label: 'Pending',
    color: '#f59e0b', // Orange for pending
  },
  completed: {
    label: 'Completed',
    color: '#10b981', // Green for completed
  },
  failed: {
    label: 'Failed',
    color: '#ef4444', // Red for failed
  },
  queued: {
    label: 'Queued',
    color: '#8b5cf6', // Purple for queued
  },
  starting: {
    label: 'Starting',
    color: '#f97316', // Orange for starting
  },
  cancelled: {
    label: 'Cancelled',
    color: '#6b7280', // Gray for cancelled
  },
} satisfies ChartConfig

export function ChartPieLabel() {
  const { t } = useLocale()
  const pathname = usePathname()
  const tenant = pathname.split('/')[1]
  // Fetch executions data for status counting
  const { data: executionsResponse } = useSWR(swrKeys.executionsODataTotal(tenant), () =>
    getExecutionsODataTotal(tenant),
  )

  // Process execution data for pie chart
  const chartData = useMemo(() => {
    if (!executionsResponse?.value) {
      return []
    }

    const executions = executionsResponse.value
    const statusCounts = {
      Running: 0,
      Pending: 0,
      Queued: 0,
      Starting: 0,
      Completed: 0,
      Failed: 0,
      Cancelled: 0,
    }

    // Count each status
    executions.forEach((execution) => {
      const status = execution.status
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status as keyof typeof statusCounts]++
      }
    })

    // Map statuses to chart data with proper colors
    const statusMapping = [
      { status: 'Running', count: statusCounts.Running, fill: chartConfig.running.color },
      { status: 'Pending', count: statusCounts.Pending, fill: chartConfig.pending.color },
      { status: 'Queued', count: statusCounts.Queued, fill: chartConfig.queued.color },
      { status: 'Starting', count: statusCounts.Starting, fill: chartConfig.starting.color },
      { status: 'Completed', count: statusCounts.Completed, fill: chartConfig.completed.color },
      { status: 'Failed', count: statusCounts.Failed, fill: chartConfig.failed.color },
      { status: 'Cancelled', count: statusCounts.Cancelled, fill: chartConfig.cancelled.color },
    ]

    return statusMapping.filter((item) => item.count > 0) // Only show statuses with actual data
  }, [executionsResponse])

  // Calculate total and growth
  const totalExecutions = chartData.reduce((sum, item) => sum + item.count, 0)
  const completedCount = chartData.find((item) => item.status === 'Completed')?.count || 0
  const successRate =
    totalExecutions > 0 ? ((completedCount / totalExecutions) * 100).toFixed(1) : '0'

  return (
    <div className="  grid grid-cols-1 gap-4  dark:*:data-[slot=card]:bg-neutral-900">
      <Card className="flex flex-col  h-full flex-1">
        <CardHeader className="items-center pb-0">
          <CardTitle>{t('dashboard.executionStatus')}</CardTitle>
          <CardDescription>{t('dashboard.realTimeDistribution')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 ">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[350px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="count" label nameKey="status" />
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 font-medium leading-none">
            {successRate}% {t('dashboard.successRate')} ({totalExecutions} {t('dashboard.total')}){' '}
            <TrendingUp className="h-7 w-4" />
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
