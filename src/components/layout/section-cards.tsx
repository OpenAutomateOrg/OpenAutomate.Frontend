'use client'

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getBotAgentsWithOData } from '@/lib/api/bot-agents'
import { getOrganizationUnitUsersWithOData } from '@/lib/api/organization-unit-user'
import { getAssetsWithOData } from '@/lib/api/assets'
import { getSchedulesWithOData } from '@/lib/api/schedules'
import { getAutomationPackagesWithOData } from '@/lib/api/automation-packages'
import useSWR from 'swr'
import { swrKeys } from '@/lib/swr-config'

export function SectionCards() {
  // const { t } = useLocale()

  // API calls to get counts for each card
  const { data: usersResponse } = useSWR(swrKeys.organizationUnits(), () =>
    getOrganizationUnitUsersWithOData({ $count: true, $top: 1 }),
  )

  const { data: agentsResponse } = useSWR(swrKeys.agentsWithOData({ $count: true, $top: 1 }), () =>
    getBotAgentsWithOData({ $count: true, $top: 1 }),
  )

  const { data: assetsResponse } = useSWR(swrKeys.assetsWithOData({ $count: true, $top: 1 }), () =>
    getAssetsWithOData({ $count: true, $top: 1 }),
  )

  const { data: schedulesResponse } = useSWR(
    swrKeys.schedulesWithOData({ $count: true, $top: 1 }),
    () => getSchedulesWithOData({ $count: true, $top: 1 }),
  )

  const { data: packagesResponse } = useSWR(
    swrKeys.packagesWithOData({ $count: true, $top: 1 }),
    () => getAutomationPackagesWithOData({ $count: true, $top: 1 }),
  )

  // Extract counts from responses
  const totalUsers = usersResponse?.['@odata.count'] ?? 0
  const totalAgents = agentsResponse?.['@odata.count'] ?? 0
  const totalAssets = assetsResponse?.['@odata.count'] ?? 0
  const totalSchedules = schedulesResponse?.['@odata.count'] ?? 0
  const totalPackages = packagesResponse?.['@odata.count'] ?? 0

  return (
    <div className=" *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-5 grid grid-cols-1 gap-4 *:data-[slot=card]:bg-white  dark:*:data-[slot=card]:bg-black/30 *:data-[slot=card]:border-orange-600/70 ">
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
          <div className="text-muted-foreground"> Total organization users</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>Agents</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600  text-2xl font-semibold tabular-nums">
              {totalAgents.toLocaleString()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground"> Total active agents</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>Assets</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600 text-2xl font-semibold tabular-nums">
              {totalAssets.toLocaleString()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Resources under control</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>Schedules</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600 text-2xl font-semibold tabular-nums">
              {totalSchedules.toLocaleString()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Scheduled tasks</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>Packages</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600 text-2xl font-semibold tabular-nums">
              {totalPackages.toLocaleString()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Automation packages</div>
        </CardFooter>
      </Card>
    </div>
  )
}
