'use client'

import { TabsCommon } from '../tabs/tabs'
import { AgentTabs } from '../data/agent-tabs-data'

export function AgentUI() {
  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex flex-col gap-6">
        <TabsCommon tabsData={AgentTabs} />
      </div>
    </main>
  )
}
