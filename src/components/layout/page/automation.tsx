'use client'

import { TabsCommon } from '../tabs/tabs'
import { AutomationTabs } from '../data/automation-tabs-data'

export function AutomationTab() {
  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex flex-col gap-6">
        <TabsCommon tabsData={AutomationTabs} />
      </div>
    </main>
  )
}
