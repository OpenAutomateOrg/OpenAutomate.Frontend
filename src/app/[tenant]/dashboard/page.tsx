import { SectionCards } from '@/components/layout/section-cards'
import { ChartPieLabel } from '@/components/layout/charts/chart-pie-label'
import { StatisticalStatus } from '@/components/layout/statistical-status'

export default function DashBoard() {
  return (
    <div className="flex flex-1 flex-col bg-muted/20 min-h-screen">
      <div className="@container/main flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-6 dark:bg-black/60">
        {/* Section Cards */}
        <div className="rounded-xl">
          <SectionCards />
        </div>
        {/* Pie Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 rounded-xl h-auto md:h-[575px]">
          <div className="flex flex-col gap-2 min-w-0">
            <StatisticalStatus />
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <ChartPieLabel />
          </div>
        </div>
      </div>
    </div>
  )
}
