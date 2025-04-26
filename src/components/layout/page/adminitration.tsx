'use client'

import { TabsCommon } from '../tabs/tabs'
import { AdminitrationTab } from '../data/adminitration-tabs-data'

export function AdminitrationUI() {
  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex flex-col gap-6">
        <TabsCommon tabsData={AdminitrationTab} />
      </div>
    </main>
  )
}
