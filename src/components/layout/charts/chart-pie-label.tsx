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
      return [
        { status: 'Cancelled', count: 0, fill: 'hsl(var(--chart-2))' },
        { status: 'Completed', count: 0, fill: 'hsl(var(--chart-3))' },
        { status: 'Failed', count: 0, fill: 'hsl(var(--chart-4))' },
      ]
    }

    const executions = executionsResponse.value
    const statusCounts = {
      Cancelled: 0,
      Completed: 0,
      Failed: 0,
    }

    // Count each status
    executions.forEach((execution) => {
      const status = execution.status.toLowerCase()
      if (status === 'cancelled') {
        statusCounts.Cancelled++
      } else if (status === 'completed') {
        statusCounts.Completed++
      } else if (status === 'failed') {
        statusCounts.Failed++
      }
    })

    return [
      { status: 'Cancelled', count: statusCounts.Cancelled, fill: 'hsl(var(--chart-2))' },
      { status: 'Completed', count: statusCounts.Completed, fill: 'hsl(var(--chart-3))' },
      { status: 'Failed', count: statusCounts.Failed, fill: 'hsl(var(--chart-4))' },
    ].filter((item) => item.count > 0) // Only show statuses with actual data
  }, [executionsResponse])

  // Calculate total and growth
  const totalExecutions = chartData.reduce((sum, item) => sum + item.count, 0)
  const completedPercentage = chartData.find((item) => item.status === 'completed')?.count || 0
  const successRate =
    totalExecutions > 0 ? ((completedPercentage / totalExecutions) * 100).toFixed(1) : '0'

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
