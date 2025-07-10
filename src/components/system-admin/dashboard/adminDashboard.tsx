'use client'

import { SectionCardsAdmin } from '@/components/layout/sectionCard/section-card-admin'
import { ChartBarInteractive } from '@/components/layout/charts/chart-bar-interactive'
import { ChartBarMultiple } from '@/components/layout/charts/chart-bar-multiple'
import { adminApi } from '@/lib/api/admin'
import { swrKeys } from '@/lib/swr-config'
import useSWR from 'swr'

export default function AdminDashBoardInterface() {
  // Admin API calls
  const { data: allUsers } = useSWR(swrKeys.adminUsers(), () => adminApi.getAllUsers())

  const { data: allOrganizationUnits } = useSWR(swrKeys.adminAllOrganizationUnits(), () =>
    adminApi.getAllOrganizationUnits(),
  )

  // Calculate totals
  const totalUsers = allUsers?.length ?? 0
  const totalOrganizationUnits = allOrganizationUnits?.length ?? 0

  return (
    <div className="flex flex-1 flex-col bg-muted/20 min-h-screen">
      <div className="@container/main flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-6 dark:bg-black/60">
        {/* Section Cards */}
        <div className="rounded-xl">
          <SectionCardsAdmin
            totalUsers={totalUsers}
            totalOrganizationUnits={totalOrganizationUnits}
          />
        </div>
        {/* Pie Charts */}
        <div className="@container/main flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-0 dark:bg-black/60">
          <ChartBarInteractive users={allUsers} organizationUnits={allOrganizationUnits} />
        </div>
        <div className="@container/main flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-0 dark:bg-black/60">
          <ChartBarMultiple />
        </div>
      </div>
    </div>
  )
}
