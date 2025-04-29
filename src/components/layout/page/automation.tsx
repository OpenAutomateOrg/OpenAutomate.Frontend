'use client'

import { useRouter } from 'next/navigation'
import { TabsCommon } from '../tabs/tabs'
import { AutomationTabs } from '../data/automation-tabs-data'

export function AutomationTab() {
  const router = useRouter()

  const handleDetailPage = (taskId: string) => {
    router.push(`/automation/${taskId}`)
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex flex-col gap-6">
        <TabsCommon tabsData={AutomationTabs} onViewDetailPage={handleDetailPage} />
      </div>
    </main>
  )
}
