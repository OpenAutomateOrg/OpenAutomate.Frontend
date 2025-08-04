'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Rectangle, XAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { RevenueStatistics } from '@/types/statistics'

export const description = 'A bar chart showing revenue statistics'

const chartConfig = {
  value: {
    label: 'Value',
  },
  totalRevenue: {
    label: 'Total Revenue',
    color: 'var(--chart-1)',
  },
  monthlyRecurringRevenue: {
    label: 'Monthly Recurring Revenue',
    color: 'var(--chart-2)',
  },
  currentMonthRevenue: {
    label: 'Current Month Revenue',
    color: 'var(--chart-3)',
  },
  previousMonthRevenue: {
    label: 'Previous Month Revenue',
    color: 'var(--chart-4)',
  },
  averageRevenuePerUser: {
    label: 'Average Revenue Per User',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ActiveBar = (props: any) => {
  return (
    <Rectangle
      {...props}
      fillOpacity={0.8}
      stroke={props.payload?.fill}
      strokeDasharray={4}
      strokeDashoffset={4}
    />
  )
}

interface ChartBarActiveProps {
  readonly revenueStatistics?: RevenueStatistics | null
}

export function ChartBarActive({ revenueStatistics }: ChartBarActiveProps) {
  // Transform revenue data into chart format
  const chartData = revenueStatistics
    ? [
        {
          metric: 'totalRevenue',
          value: revenueStatistics.totalRevenue,
          fill: 'var(--color-totalRevenue)',
        },
        {
          metric: 'monthlyRecurringRevenue',
          value: revenueStatistics.monthlyRecurringRevenue,
          fill: 'var(--color-monthlyRecurringRevenue)',
        },
        {
          metric: 'currentMonthRevenue',
          value: revenueStatistics.currentMonthRevenue,
          fill: 'var(--color-currentMonthRevenue)',
        },
        {
          metric: 'previousMonthRevenue',
          value: revenueStatistics.previousMonthRevenue,
          fill: 'var(--color-previousMonthRevenue)',
        },
        {
          metric: 'averageRevenuePerUser',
          value: revenueStatistics.averageRevenuePerUser,
          fill: 'var(--color-averageRevenuePerUser)',
        },
      ]
    : []

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (!revenueStatistics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Statistics</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">Loading revenue data...</div>
        </CardContent>
      </Card>
    )
  }

  const isPositiveGrowth = (revenueStatistics?.revenueGrowthPercentage ?? 0) >= 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Statistics</CardTitle>
        <CardDescription>
          {revenueStatistics?.lastUpdated
            ? `Last updated: ${formatDate(revenueStatistics.lastUpdated)}`
            : 'Revenue overview'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="metric"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => formatCurrency(Number(value))}
                />
              }
            />
            <Bar dataKey="value" strokeWidth={2} radius={8} activeIndex={2} activeBar={ActiveBar} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {isPositiveGrowth ? (
            <>
              Revenue growth: {revenueStatistics?.revenueGrowthPercentage.toFixed(1)}% this month{' '}
              <TrendingUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Revenue decline:{' '}
              {Math.abs(revenueStatistics?.revenueGrowthPercentage ?? 0).toFixed(1)}% this month{' '}
              <TrendingDown className="h-4 w-4" />
            </>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Active subscriptions: {revenueStatistics?.activeSubscriptions || 0} | Trial subscriptions:{' '}
          {revenueStatistics?.trialSubscriptions || 0}
        </div>
      </CardFooter>
    </Card>
  )
}
