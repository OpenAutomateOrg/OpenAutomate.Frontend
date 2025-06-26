'use client'

import { TrendingUp } from 'lucide-react'
import { Pie, PieChart } from 'recharts'
import { getExecutionsWithOData } from '@/lib/api/executions'
import { swrKeys } from '@/lib/swr-config'
import useSWR from 'swr'
import { useMemo } from 'react'

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
    color: 'hsl(var(--chart-1))',
  },
  pending: {
    label: 'Pending',
    color: 'hsl(var(--chart-2))',
  },
  completed: {
    label: 'Completed',
    color: 'hsl(var(--chart-3))',
  },
  failed: {
    label: 'Failed',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig

export function ChartPieLabel() {
  // Fetch executions data for status counting
  const { data: executionsResponse } = useSWR(
    swrKeys.executionsWithOData({ $count: true, $top: 1000 }),
    () => getExecutionsWithOData({ $count: true, $top: 1000 }),
  )

  // Process execution data for pie chart
  const chartData = useMemo(() => {
    if (!executionsResponse?.value) {
      return [
        { status: 'running', count: 0, fill: 'hsl(var(--chart-1))' },
        { status: 'pending', count: 0, fill: 'hsl(var(--chart-2))' },
        { status: 'completed', count: 0, fill: 'hsl(var(--chart-3))' },
        { status: 'failed', count: 0, fill: 'hsl(var(--chart-4))' },
      ]
    }

    const executions = executionsResponse.value
    const statusCounts = {
      running: 0,
      pending: 0,
      completed: 0,
      failed: 0,
    }

    // Count each status
    executions.forEach((execution) => {
      const status = execution.status.toLowerCase()
      if (status === 'running') {
        statusCounts.running++
      } else if (status === 'pending') {
        statusCounts.pending++
      } else if (status === 'completed') {
        statusCounts.completed++
      } else if (status === 'failed') {
        statusCounts.failed++
      }
    })

    return [
      { status: 'running', count: statusCounts.running, fill: 'hsl(var(--chart-1))' },
      { status: 'pending', count: statusCounts.pending, fill: 'hsl(var(--chart-2))' },
      { status: 'completed', count: statusCounts.completed, fill: 'hsl(var(--chart-3))' },
      { status: 'failed', count: statusCounts.failed, fill: 'hsl(var(--chart-4))' },
    ].filter((item) => item.count > 0) // Only show statuses with actual data
  }, [executionsResponse])

  // Calculate total and growth
  const totalExecutions = chartData.reduce((sum, item) => sum + item.count, 0)
  const completedPercentage = chartData.find((item) => item.status === 'completed')?.count || 0
  const successRate =
    totalExecutions > 0 ? ((completedPercentage / totalExecutions) * 100).toFixed(1) : '0'

  return (
    <div className="  grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-orange-600/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card ">
      <Card className="flex flex-col  h-full flex-1">
        <CardHeader className="items-center pb-0">
          <CardTitle>Execution Status</CardTitle>
          <CardDescription>Real-time execution distribution</CardDescription>
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
            {successRate}% success rate ({totalExecutions} total) <TrendingUp className="h-7 w-4" />
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
