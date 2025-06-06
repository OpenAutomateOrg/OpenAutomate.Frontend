'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ExecutionsRow } from '../executions'

interface ExecutionDetailProps {
  id: string
}

// Helper function to get badge class based on status
const getStatusBadgeClass = (status: string) => {
  if (status === 'Disconnected') return 'bg-red-100 text-red-600 border-none'
  if (status === 'Offline') return 'bg-yellow-100 text-yellow-600 border-none'
  return 'bg-green-100 text-green-600 border-none'
}

export default function ScheduledDetail({ id }: ExecutionDetailProps) {
  const router = useRouter()
  const [execution, setExecution] = useState<ExecutionsRow | null>(null)

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockExecution: ExecutionsRow = {
      id,
      name: 'Excution 2',
      label: 'Excution Label',
      value: 'Some Value',
      type: 'Type A',
      createdBy: 'Admin',
      //   machineName: 'Machine name',
      status: 'Disconnected',
      //   lastConnected: '2023-10-15T14:30:00Z',
    }
    setExecution(mockExecution)
  }, [id])

  const handleBack = () => {
    router.back()
  }

  if (!execution) {
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
              <DetailBlock label="Name">{execution.name}</DetailBlock>
              <DetailBlock label="Machine name"></DetailBlock>
            </div>
            <div className="space-y-4">
              <DetailBlock label="Status">
                <Badge variant="outline" className={getStatusBadgeClass(execution.status)}>
                  {execution.status}
                </Badge>
              </DetailBlock>
              <DetailBlock label="Last Connected">
                {/* {new Date(execution.lastConnected).toLocaleString()} */}
              </DetailBlock>
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
