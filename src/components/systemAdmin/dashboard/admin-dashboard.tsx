'use client'

import { SectionCardsAdmin } from '@/components/layout/section-card/section-card-admin'
import { ChartBarInteractive } from '@/components/layout/charts/chart-bar-interactive'
import { adminApi } from '@/lib/api/admin'
import { swrKeys } from '@/lib/config/swr-config'
import useSWR from 'swr'

export default function AdminDashBoardInterface() {
  // Admin API calls
  const { data: allUsers } = useSWR(swrKeys.adminUsers(), () => adminApi.getAllUsers())

  const { data: allOrganizationUnits } = useSWR(swrKeys.adminAllOrganizationUnits(), () =>
    adminApi.getAllOrganizationUnits(),
  )

  const { data: totals } = useSWR(swrKeys.adminAllTotals(), () => adminApi.getSystemStatistics())

  // Calculate totals

  return (
    <div className="flex flex-1 flex-col bg-muted/20 min-h-screen">
      <div className="@container/main flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-6 dark:bg-black/60">
        {/* Section Cards */}
        <div className="rounded-xl">
          <SectionCardsAdmin
            totalUsers={totals?.totalUsers}
            totalOrganizationUnits={totals?.totalOrganizationUnits}
          />
        </div>
        {/* Pie Charts */}
        <div className="@container/main flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-0 dark:bg-black/60">
          <ChartBarInteractive users={allUsers} organizationUnits={allOrganizationUnits} />
        </div>
      </div>
    </div>
  )
}
