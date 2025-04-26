'use client'

import { TabsCommon } from '../tabs/tabs'
import { AssetTab } from '../data/asset-tabs-data'

export function AssetUI() {
  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex flex-col gap-6">
        <TabsCommon tabsData={AssetTab} />
      </div>
    </main>
  )
}
