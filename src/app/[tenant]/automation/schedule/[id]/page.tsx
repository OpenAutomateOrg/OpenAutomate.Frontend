'use client'

import ScheduleDetail from '@/components/automation/schedule/schedule/schedule-detail'
import { use } from 'react'

interface ScheduleDetailPageProps {
  params: Promise<{
    tenant: string
    id: string
  }>
}

export default function ScheduleDetailPage({ params }: ScheduleDetailPageProps) {
  const { id } = use(params)
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      <ScheduleDetail id={id} />
    </div>
  )
}
