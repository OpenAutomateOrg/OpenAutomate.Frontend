'use client'

import { TrendingUp } from 'lucide-react'
import { Pie, PieChart } from 'recharts'

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
const chartData = [
  { browser: 'chrome', visitors: 275, fill: 'hsl(var(--chart-1))' },
  { browser: 'safari', visitors: 200, fill: 'hsl(var(--chart-2))' },
  { browser: 'firefox', visitors: 187, fill: 'hsl(var(--chart-3))' },
  { browser: 'edge', visitors: 173, fill: 'hsl(var(--chart-4))' },
  { browser: 'other', visitors: 90, fill: 'hsl(var(--chart-5))' },
]

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  chrome: {
    label: 'Chrome',
    color: 'white', // Adjusted color value
  },
  safari: {
    label: 'Safari',
    color: 'oklch(0.7 0.15 150)', // Adjusted color value
  },
  firefox: {
    label: 'Firefox',
    color: 'oklch(0.6 0.2 100)', // Adjusted color value
  },
  edge: {
    label: 'Edge',
    color: 'oklch(0.5 0.25 50)', // Adjusted color value
  },
  other: {
    label: 'Other',
    color: 'oklch(0.4 0.3 0)', // Adjusted color value
  },
} satisfies ChartConfig

export function ChartPieLabel() {
  return (
    <div className="*:data-[slot=card]:shadow-xs  grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-orange-600/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Agent</CardTitle>
          <CardDescription>January - June 2024</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px] pb-0 [&_.recharts-pie-label-text]:fill-[var(--color-other)]"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="visitors" label nameKey="browser" />
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 font-medium leading-none">
            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Showing total visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
