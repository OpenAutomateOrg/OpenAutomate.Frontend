'use client'

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface SectionCardsAdminProps {
  totalUsers?: number
  totalOrganizationUnits?: number
  revenueStatistics?: number
}

export function SectionCardsAdmin({
  totalUsers = 0,
  totalOrganizationUnits = 0,
  revenueStatistics = 0,
}: Readonly<SectionCardsAdminProps>) {
  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3 grid grid-cols-1 gap-4 *:data-[slot=card]:bg-white dark:*:data-[slot=card]:bg-neutral-900">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>Users</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600 text-2xl font-semibold tabular-nums">
              {totalUsers}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Total users</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>Organizations</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600 text-2xl font-semibold tabular-nums">
              {totalOrganizationUnits}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Total active organizations</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>Total Revenue</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600 text-2xl font-semibold tabular-nums">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                revenueStatistics,
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Resources under control</div>
        </CardFooter>
      </Card>
    </div>
  )
}
