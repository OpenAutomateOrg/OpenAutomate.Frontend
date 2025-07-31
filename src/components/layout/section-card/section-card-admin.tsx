'use client'

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface SectionCardsAdminProps {
  totalUsers?: number
  totalOrganizationUnits?: number
}

export function SectionCardsAdmin({
  totalUsers = 0,
  totalOrganizationUnits = 0,
}: SectionCardsAdminProps) {
  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3 grid grid-cols-1 gap-4 *:data-[slot=card]:bg-white dark:*:data-[slot=card]:bg-neutral-900">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>Users</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600 text-2xl font-semibold tabular-nums">
              {totalUsers.toLocaleString()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Total organization users</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>Agents</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600 text-2xl font-semibold tabular-nums">
              {totalOrganizationUnits.toLocaleString()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Total active agents</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>Total Billing</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600 text-2xl font-semibold tabular-nums">
              0
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
