'use client'

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getBotAgentsODataTotal } from '@/lib/api/bot-agents'
import { getOrganizationUnitUsersODataTotal } from '@/lib/api/organization-unit-user'
import { getAssetsODataTotal } from '@/lib/api/assets'
import { getSchedulesODataTotal } from '@/lib/api/schedules'
import { getAutomationPackagesODataTotal } from '@/lib/api/automation-packages'
import useSWR from 'swr'
import { swrKeys } from '@/lib/config/swr-config'
import { usePathname } from 'next/navigation'
import { useLocale } from '@/providers/locale-provider'

export function SectionCards() {
  const { t } = useLocale()
  const pathname = usePathname()

  const tenant = pathname.split('/')[1]

  // API calls to get counts for each card
  const { data: usersResponse } = useSWR(swrKeys.organizationUnitUsersTotal(tenant), () =>
    getOrganizationUnitUsersODataTotal(tenant),
  )

  const { data: agentsResponse } = useSWR(swrKeys.agentsWithTotal(tenant), () =>
    getBotAgentsODataTotal(tenant),
  )

  const { data: assetsResponse } = useSWR(swrKeys.assetsWithTotal(tenant), () =>
    getAssetsODataTotal(tenant),
  )

  const { data: schedulesResponse } = useSWR(swrKeys.schedulesWithTotal(tenant), () =>
    getSchedulesODataTotal(tenant),
  )

  const { data: packagesResponse } = useSWR(swrKeys.packagesWithTotal(tenant), () =>
    getAutomationPackagesODataTotal(tenant),
  )

  // Extract counts from responses
  const totalUsers = usersResponse?.['@odata.count'] ?? 0
  const totalAgents = agentsResponse?.['@odata.count'] ?? 0
  const totalAssets = assetsResponse?.['@odata.count'] ?? 0
  const totalSchedules = schedulesResponse?.['@odata.count'] ?? 0
  const totalPackages = packagesResponse?.['@odata.count'] ?? 0

  return (
    <div className=" *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-5 grid grid-cols-1 gap-4 *:data-[slot=card]:bg-white  dark:*:data-[slot=card]:bg-neutral-900 ">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>{t('sectionCard.user')}</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600 text-2xl font-semibold tabular-nums">
              {totalUsers.toLocaleString()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground"> {t('sectionCard.totalUsers')}</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>{t('sectionCard.agent')}</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600  text-2xl font-semibold tabular-nums">
              {totalAgents.toLocaleString()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground"> {t('sectionCard.totalAgents')}</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>{t('sectionCard.assets')}</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600 text-2xl font-semibold tabular-nums">
              {totalAssets.toLocaleString()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">{t('sectionCard.totalAssets')}</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>{t('sectionCard.schedules')}</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600 text-2xl font-semibold tabular-nums">
              {totalSchedules.toLocaleString()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">{t('sectionCard.totalSchedules')}</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>{t('sectionCard.packages')}</CardTitle>
          <div className="flex justify-end">
            <CardDescription className="@[250px]/card:text-3xl text-orange-600 text-2xl font-semibold tabular-nums">
              {totalPackages.toLocaleString()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">{t('sectionCard.totalPackages')}</div>
        </CardFooter>
      </Card>
    </div>
  )
}
