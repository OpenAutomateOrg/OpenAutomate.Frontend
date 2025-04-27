'use client'

import { useState } from 'react'

import type { Tab } from '@/types/tabs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TabsCommonProps {
  tabsData: Tab[]
}

export function TabsCommon({ tabsData }: TabsCommonProps) {
  const [activeTab, setActiveTab] = useState(tabsData[0].id)
  const [activeSubTabs, setActiveSubTabs] = useState(() => {
    // Initialize active sub-tabs for tabs that have them
    const initialSubTabs: Record<string, string> = {}
    tabsData.forEach((tab) => {
      if (tab.hasSubTabs && tab.subTabs && tab.subTabs.length > 0) {
        initialSubTabs[tab.id] = tab.subTabs[0].id
      }
    })
    return initialSubTabs
  })

  // Handle main tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  // Handle sub-tab change
  const handleSubTabChange = (tabId: string, subTabId: string) => {
    setActiveSubTabs((prev) => ({
      ...prev,
      [tabId]: subTabId,
    }))
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList
          className="grid w-full"
          style={{ gridTemplateColumns: `repeat(${tabsData.length}, minmax(0, 1fr))` }}
        >
          {tabsData.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Contents */}
        {tabsData.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="border rounded-lg p-4">
            {tab.hasSubTabs && tab.subTabs ? (
              // Render sub-tabs if this tab has them
              <Tabs
                value={activeSubTabs[tab.id] || (tab.subTabs[0]?.id ?? '')}
                onValueChange={(value) => handleSubTabChange(tab.id, value)}
                className="w-full"
              >
                <TabsList className="mb-4">
                  {tab.subTabs.map((subTab) => (
                    <TabsTrigger
                      key={subTab.id}
                      value={subTab.id}
                      className="flex items-center gap-2"
                    >
                      <subTab.icon className="h-4 w-4" />
                      {subTab.title}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Sub-Tab Contents with Data Display */}
                {tab.subTabs.map((subTab) => (
                  <TabsContent key={subTab.id} value={subTab.id}>
                    <div className="rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <subTab.icon className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">{subTab.title}</h2>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              // Render data directly if this tab doesn't have sub-tabs
              <div className="rounded-lg"></div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
