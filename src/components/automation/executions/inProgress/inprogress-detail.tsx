'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Clock, Package, Bot, AlertCircle, CheckCircle, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { swrKeys } from '@/lib/config/swr-config'
import { getExecutionById } from '@/lib/api/executions'
import { createErrorToast } from '@/lib/utils/error-utils'
import { formatUtcToLocal } from '@/lib/utils/datetime'
import { useExecutionNames } from '@/hooks/use-execution-names'

interface ExecutionDetailProps {
  readonly id: string
}

// Helper function to get badge class based on status
const getStatusBadgeClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'running':
    case 'in progress':
      return 'bg-blue-100 text-blue-700 border-blue-300'
    case 'starting':
      return 'bg-orange-100 text-orange-700 border-orange-300'
    case 'pending':
    case 'queued':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    case 'completed':
    case 'success':
      return 'bg-green-100 text-green-700 border-green-300'
    case 'failed':
    case 'error':
      return 'bg-red-100 text-red-700 border-red-300'
    case 'cancelled':
    case 'canceled':
      return 'bg-gray-100 text-gray-700 border-gray-300'
    default:
      return 'bg-blue-100 text-blue-700 border-blue-300'
  }
}

export default function InProgressDetail({ id }: ExecutionDetailProps) {
  const router = useRouter()
  const { toast } = useToast()

  // ✅ SWR for data fetching
  const {
    data: execution,
    error,
    isLoading,
    mutate,
  } = useSWR(swrKeys.executionById(id), () => getExecutionById(id))

  // ✅ Resolve package and bot agent names
  const { packageName, botAgentName } = useExecutionNames(
    execution?.packageId,
    execution?.botAgentId,
  )

  // ✅ Error handling in dedicated effect
  useEffect(() => {
    if (error) {
      toast(createErrorToast(error))
    }
  }, [error, toast])

  // ✅ Auto-refresh for in-progress executions
  useEffect(() => {
    if (execution && ['running', 'pending'].includes(execution.status?.toLowerCase())) {
      const interval = setInterval(() => {
        mutate()
      }, 5000) // Refresh every 5 seconds

      return () => clearInterval(interval)
    }
  }, [execution, mutate])

  const handleBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <LoadingState message="Loading execution details..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="border rounded-md shadow-sm">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Execution</h3>
            <p className="text-muted-foreground mb-4">
              Unable to load execution details. Please try again.
            </p>
            <Button onClick={handleBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!execution) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="border rounded-md shadow-sm">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Execution Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The requested execution could not be found.
            </p>
            <Button onClick={handleBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card className="border rounded-md shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-1" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">
              {packageName ||
                execution.packageName ||
                `Package ${execution.packageId?.substring(0, 8)}` ||
                'In Progress Execution'}
            </h1>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Execution Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Execution Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <DetailBlock label="Package Name" icon={Package}>
                  {packageName ||
                    execution.packageName ||
                    execution.packageId?.substring(0, 8) ||
                    'N/A'}
                </DetailBlock>
                <DetailBlock label="Package Version" icon={Package}>
                  {execution.packageVersion || 'latest'}
                </DetailBlock>
                <DetailBlock label="Bot Agent" icon={Bot}>
                  {botAgentName ||
                    execution.botAgentName ||
                    execution.botAgentId?.substring(0, 8) ||
                    'N/A'}
                </DetailBlock>
              </div>
              <div className="space-y-4">
                <DetailBlock label="Status" icon={CheckCircle}>
                  <Badge variant="outline" className={getStatusBadgeClass(execution.status)}>
                    {execution.status}
                  </Badge>
                </DetailBlock>
                <DetailBlock label="Start Time" icon={Clock}>
                  {formatUtcToLocal(execution.startTime, {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                    fallback: 'N/A',
                  })}
                </DetailBlock>
                <DetailBlock label="Running Duration" icon={Clock}>
                  {execution.startTime
                    ? (() => {
                        const durationMs = Date.now() - new Date(execution.startTime).getTime()
                        const durationMin = Math.floor(durationMs / 60000)
                        const durationSec = Math.floor((durationMs % 60000) / 1000)
                        return `${durationMin}m ${durationSec}s`
                      })()
                    : 'N/A'}
                </DetailBlock>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

// Block hiển thị label trên, value dưới, có border-b
function DetailBlock({
  label,
  children,
  icon: Icon,
}: {
  readonly label: string
  readonly children?: React.ReactNode
  readonly icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <div className="text-base font-medium pb-1 border-b">{children}</div>
    </div>
  )
}
