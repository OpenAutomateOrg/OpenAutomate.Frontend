'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import type { Tab } from '@/types/tabs'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '../table/task-table'
interface TabsCommonProps {
  tabsData: Tab[]
  // If true, will sync tab state with URL search params (default: true)
  useUrlParams?: boolean
}

export function TabsCommon({ tabsData, useUrlParams = true }: TabsCommonProps) {
  const searchParams = useSearchParams()
  
  // Get initial active tab from URL if available, otherwise use first tab
  const initialTabId = searchParams.get('tab') || tabsData[0].id
  const [activeTab, setActiveTab] = useState(initialTabId)
  
  // Initialize active sub-tabs
  const [activeSubTabs, setActiveSubTabs] = useState<Record<string, string>>({})
  
  // Initialize sub-tabs on component mount and URL changes
  useEffect(() => {
    // Get default sub-tab for each tab
    const initialSubTabs: Record<string, string> = {}
    tabsData.forEach((tab) => {
      if (tab.hasSubTabs && tab.subTabs && tab.subTabs.length > 0) {
        // Check for sub-tab in URL or use the first one
        const subTabParam = searchParams.get(`${tab.id}_subtab`)
        initialSubTabs[tab.id] = subTabParam || tab.subTabs[0].id
      }
    })
    
    setActiveSubTabs(initialSubTabs)
    
    // Update active tab from URL
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl) {
      setActiveTab(tabFromUrl)
    }
  }, [tabsData, searchParams])

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
      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange} 
        className="w-full"
        useUrlParams={useUrlParams}
        paramName="tab"
      >
        <TabsList
          className="grid w-full"
          style={{ gridTemplateColumns: `repeat(${tabsData.length}, minmax(0, 1fr))` }}
        >
          {tabsData.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              {tab.icon && <tab.icon className="h-4 w-4" />}
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
                useUrlParams={useUrlParams}
                paramName={`${tab.id}_subtab`}
              >
                <TabsList className="mb-4">
                  {tab.subTabs.map((subTab) => (
                    <TabsTrigger
                      key={subTab.id}
                      value={subTab.id}
                      className="flex items-center gap-2"
                    >
                      {subTab.icon && <subTab.icon className="h-4 w-4" />}
                      {subTab.title}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Sub-Tab Contents with Data Display */}
                {tab.subTabs.map((subTab) => (
                  <TabsContent key={subTab.id} value={subTab.id}>
                    {subTab.tableData && subTab.columns && (
                      <DataTable
                        data={subTab.tableData}
                        columns={subTab.columns}
                        detailPath={`/detail/${tab.id}/${subTab.id}`}
                        idField="id"
                        searchField="name"
                        onViewDetailPage={onViewDetailPage}
                      />
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              // Render data directly if this tab doesn't have sub-tabs
              tab.tableData &&
              tab.columns && (
                <DataTable
                  data={tab.tableData}
                  columns={tab.columns}
                  detailPath={`/detail/${tab.id}`}
                  idField="id"
                  searchField="name"
                  onViewDetailPage={onViewDetailPage}
                />
              )
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
