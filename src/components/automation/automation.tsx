'use client'

import { Metadata } from 'next'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { columns } from '../asset/columns'
import { DataTable } from '@/components/layout/table/data-table'
import { useEffect, useState } from 'react'
import { CreateEditModal } from '@/components/asset/create-edit-modal'
import { Calendar, Clock, History } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata: Metadata = {
  title: '',
  description: '',
}

export default function AutomationAutomationInterface() {
  const [data, setDatas] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [activeTab, setActiveTab] = useState('inprogress')

  useEffect(() => {
    fetch('/api/tasks')
      .then((res) => res.json())
      .then(setDatas)
  }, [])

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <Tabs defaultValue="inprogress" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="inprogress" className="flex items-center gap-2">
              <Clock
                className={cn(
                  'h-4 w-4',
                  activeTab === 'inprogress' ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              In Progress
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Calendar
                className={cn(
                  'h-4 w-4',
                  activeTab === 'scheduled' ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="historical" className="flex items-center gap-2">
              <History
                className={cn(
                  'h-4 w-4',
                  activeTab === 'historical' ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              Historical
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inprogress">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setModalMode('create')
                    setIsModalOpen(true)
                  }}
                  className=" flex items-center justify-center"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create
                </Button>
              </div>
              <DataTable data={data} columns={columns} />
            </div>
          </TabsContent>

          <TabsContent value="scheduled">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setModalMode('create')
                    setIsModalOpen(true)
                  }}
                  className=" flex items-center justify-center"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create
                </Button>
              </div>
              <DataTable data={data} columns={columns} />
            </div>
          </TabsContent>

          <TabsContent value="historical">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setModalMode('create')
                    setIsModalOpen(true)
                  }}
                  className=" flex items-center justify-center"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create
                </Button>
              </div>
              <DataTable data={data} columns={columns} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <CreateEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
        }}
        mode={modalMode}
      />
    </>
  )
}
