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
    return <ScheduleDetail id={id} />
}
