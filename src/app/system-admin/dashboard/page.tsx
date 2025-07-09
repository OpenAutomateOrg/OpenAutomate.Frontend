import { SectionCardsAdmin } from '@/components/layout/sectionCard/section-card-admin'
import { ChartBarInteractive } from '@/components/layout/charts/chart-bar-interactive'
import { ChartBarMultiple } from '@/components/layout/charts/chart-bar-multiple'

export default function DashBoard() {
  return (
    <div className="flex flex-1 flex-col bg-muted/20 min-h-screen">
      <div className="@container/main flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-6 dark:bg-black/60">
        {/* Section Cards */}
        <div className="rounded-xl">
          <SectionCardsAdmin />
        </div>
        {/* Pie Charts */}
        <div className="@container/main flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-0 dark:bg-black/60">
          <ChartBarMultiple />
        </div>
        <div className="@container/main flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-0 dark:bg-black/60">
          <ChartBarInteractive />
        </div>
      </div>
    </div>
  )
}
