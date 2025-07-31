'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { User } from '@/types/auth'
import { OrganizationUnit } from '@/types/organization'

export const description = 'An interactive bar chart'

interface ChartBarInteractiveProps {
  users?: User[]
  organizationUnits?: OrganizationUnit[]
}

const chartConfig = {
  views: {
    label: 'System Statistics',
  },
  users: {
    label: 'Users',
    color: 'var(--chart-1)',
  },
  organizationUnits: {
    label: 'Organization Units',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

export function ChartBarInteractive({
  users = [],
  organizationUnits = [],
}: ChartBarInteractiveProps) {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>('users')

  // Transform the data to create chart data based on creation dates
  const chartData = React.useMemo(() => {
    // Get the last 30 days
    const today = new Date()
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split('T')[0]
    })

    // Group users and org units by creation date
    const usersByDate = users.reduce(
      (acc) => {
        // Since users don't have createdAt, we'll distribute them evenly or use a fallback
        // For demo purposes, we'll create sample data
        const randomIndex = Math.floor(50 * last30Days.length)
        const date = last30Days[randomIndex]
        acc[date] = (acc[date] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const orgUnitsByDate = organizationUnits.reduce(
      (acc, orgUnit) => {
        // Handle the date format from API response (e.g., "2025-07-08T17:36:10.0995664")
        // Split by 'T' and take the date part, or use Date parsing with fallback
        let createdDate: string
        try {
          if (orgUnit.createdAt) {
            // If the date contains microseconds, truncate to milliseconds for better parsing
            const dateStr = orgUnit.createdAt.includes('.')
              ? orgUnit.createdAt.split('.')[0] + 'Z'
              : orgUnit.createdAt
            createdDate = new Date(dateStr).toISOString().split('T')[0]
          } else {
            // Fallback to today's date if createdAt is missing
            createdDate = new Date().toISOString().split('T')[0]
          }
        } catch {
          // If date parsing fails, fallback to today's date
          createdDate = new Date().toISOString().split('T')[0]
        }

        if (last30Days.includes(createdDate)) {
          acc[createdDate] = (acc[createdDate] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    return last30Days.map((date) => ({
      date,
      users: usersByDate[date] || 0,
      organizationUnits: orgUnitsByDate[date] || 0,
    }))
  }, [users, organizationUnits])

  const total = React.useMemo(
    () => ({
      users: users.length,
      organizationUnits: organizationUnits.length,
    }),
    [users, organizationUnits],
  )

  return (
    <Card className="py-0 dark:*:data-[slot=card]:bg-neutral-900 ">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle>System Statistics - Interactive</CardTitle>
          <CardDescription>Showing system data for the last 30 days</CardDescription>
        </div>
        <div className="flex">
          {['users', 'organizationUnits'].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">{chartConfig[chart].label}</span>
                <span className="text-lg text-orange-600 leading-none font-bold sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
