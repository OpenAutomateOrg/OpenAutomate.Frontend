import { ChartAreaInteractive } from '@/components/layout/charts/chart-area-interactive'
import { SectionCards } from '@/components/layout/section-cards'
import { ChartPieLabel } from '@/components/layout/charts/chart-pie-label'
import { ChartBarDefault } from '@/components/layout/charts/chart-bar-defaut'
import { SearchBar } from '@/components/layout/search/search-bar'

export default function Page() {
  return (
    <div className="flex flex-1 flex-col bg-muted/20 min-h-screen">
      <div className="@container/main flex flex-1 flex-col gap-4  lg:p-6">
        {/* Search */}
        <div className=" top-0 z-10  rounded-xl  w-[20%] min-w-[200px]">
          <SearchBar />
        </div>

        {/* Section Cards */}
        <div className="rounded-xl  ">
          <SectionCards />
        </div>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className=" rounded-xl ">
              <ChartPieLabel />
            </div>
          ))}
        </div>

        {/* Bar & Area Chart Section */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          <div className="col-span-1  rounded-xl ">
            <ChartBarDefault />
          </div>
          <div className="col-span-1 lg:col-span-2  rounded-xl ">
            <ChartAreaInteractive />
          </div>
        </div>
      </div>
    </div>
  )
}
