'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ScheduleResponseDto, RecurrenceType } from '@/lib/api/schedules'

interface ScheduleDetailProps {
  id: string
}

// Helper function to get badge class based on status
const getStatusBadgeClass = (isEnabled: boolean) => {
  if (isEnabled) return 'bg-green-100 text-green-600 border-none'
  return 'bg-red-100 text-red-600 border-none'
}

export default function ScheduleDetail({ id }: ScheduleDetailProps) {
  const router = useRouter()
  const [schedule, setSchedule] = useState<ScheduleResponseDto | null>(null)

  useEffect(() => {
    // TODO: Replace with actual API call
    const mockSchedule: ScheduleResponseDto = {
      id,
      name: 'Daily Data Processing',
      description: 'Processes daily data files',
      isEnabled: true,
      recurrenceType: RecurrenceType.Daily,
      timeZoneId: 'Asia/Ho_Chi_Minh',
      automationPackageId: '1',
      botAgentId: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      automationPackageName: 'Data Processing Package',
      botAgentName: 'Agent 1 - Windows Server',
    }
    setSchedule(mockSchedule)
  }, [id])

  const handleBack = () => {
    router.back()
  }

  if (!schedule) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="border rounded-md shadow-sm">
        <CardHeader className="flex items-center justify-between border-b p-4">
          <Button variant="ghost" size="sm" className="gap-1" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <DetailBlock label="Name">{schedule.name}</DetailBlock>
              <DetailBlock label="Description">
                {schedule.description || 'No description'}
              </DetailBlock>
              <DetailBlock label="Package">{schedule.automationPackageName || 'N/A'}</DetailBlock>
            </div>
            <div className="space-y-4">
              <DetailBlock label="Status">
                <Badge variant="outline" className={getStatusBadgeClass(schedule.isEnabled)}>
                  {schedule.isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </DetailBlock>
              <DetailBlock label="Agent">{schedule.botAgentName || 'N/A'}</DetailBlock>
              <DetailBlock label="Timezone">{schedule.timeZoneId}</DetailBlock>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Block hiển thị label trên, value dưới, có border-b
function DetailBlock({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="text-base font-medium pb-1 border-b">{children}</div>
    </div>
  )
}
