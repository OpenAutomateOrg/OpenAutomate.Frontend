'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, RefreshCw } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { getBotAgentById } from '@/lib/api/bot-agents'
import { config } from '@/lib/config'
import { useAgentStatus } from '@/hooks/useAgentStatus'
import type { ReactNode } from 'react'
import useSWR from 'swr'
import { swrKeys } from '@/lib/swr-config'
import { useToast } from '@/components/ui/use-toast'

interface AgentDetailProps {
  readonly id: string
}

interface DetailBlockProps {
  readonly label: string
  readonly children?: ReactNode
}

// Helper function to get badge class based on status
const getStatusBadgeClass = (status: string) => {
  if (status === 'Disconnected') return 'bg-red-100 text-red-600 border-none'
  if (status === 'Busy') return 'bg-yellow-100 text-yellow-600 border-none'
  if (status === 'Available') return 'bg-green-100 text-green-600 border-none'
  return 'bg-gray-100 text-gray-600 border-none' // fallback for any other status
}

export default function AgentDetail({ id }: AgentDetailProps) {
  const router = useRouter()
  const params = useParams()
  const tenant = params?.['tenant'] as string
  const agentStatuses = useAgentStatus(tenant)
  const { toast } = useToast()

  // ✅ SWR for agent data - following guideline #8: use framework-level loaders
  const { data: agentData, error: agentError, isLoading: loading } = useSWR(
    id ? swrKeys.agentById(id) : null,
    () => getBotAgentById(id)
  )

  // ✅ Transform data during render (following guideline #1: prefer deriving data during render)
  const agent = useMemo(() => {
    if (!agentData) return null
    return {
      ...agentData,
      botAgentId: agentData.id, // Ensure botAgentId is present
    }
  }, [agentData])

  // ✅ Handle SWR errors (following guideline #3: error handling in dedicated effects)
  // Client-only: Requires toast notifications for user feedback
  useEffect(() => {
    if (agentError) {
      console.error('Failed to load agent details:', agentError)
      toast({
        title: 'Error',
        description: 'Failed to load agent details.',
        variant: 'destructive',
      })
    }
  }, [agentError, toast])

  // Frontend URL for agent connection
  const frontendUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : config.app.url

  // Custom error handler to filter out SignalR connection errors
  useEffect(() => {
    const originalConsoleError = console.error
    console.error = (...args) => {
      // Filter out SignalR timeout and connection errors
      if (
        args.length > 0 &&
        typeof args[0] === 'string' &&
        (args[0].includes('Server timeout') ||
          args[0].includes('SignalR') ||
          args[0].includes('connection') ||
          args[0].includes('Connection') ||
          args[0].includes('Failed to start') ||
          args[0].includes('negotiation'))
      ) {
        console.debug('[Suppressed SignalR Error]', ...args)
        return
      }
      originalConsoleError(...args)
    }

    return () => {
      console.error = originalConsoleError
    }
  }, [])

  const handleBack = () => {
    router.back()
  }

  // Determine the real-time status if available
  const realTimeStatus = agentStatuses[id]?.status
  const statusToDisplay = realTimeStatus ?? agent?.status ?? ''

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-10">
        <div className="animate-spin text-primary">
          <RefreshCw className="h-10 w-10" />
        </div>
      </div>
    )
  }

  if (agentError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
        <p className="text-red-800 dark:text-red-300">Failed to load agent details.</p>
        <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  if (!agent) {
    return <div>Agent not found</div>
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="border rounded-md shadow-sm">
        <CardHeader className="flex items-center justify-between border-b p-4">
          <Button variant="ghost" size="sm" className="gap-1" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => {
              window.location.href =
                'https://openautomate-agent.s3.ap-southeast-1.amazonaws.com/OpenAutomate.BotAgent.Installer.msi'
            }}
          >
            <Download className="h-4 w-4" />
            Download Agent
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <DetailBlock label="Name">{agent.name}</DetailBlock>
              <DetailBlock label="Machine name">{agent.machineName}</DetailBlock>
            </div>
            <div className="space-y-4">
              <DetailBlock label="Status">
                <Badge variant="outline" className={getStatusBadgeClass(statusToDisplay)}>
                  {statusToDisplay}
                </Badge>
              </DetailBlock>
            </div>
          </div>

          {/* Connection Information Section */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Connection Information</h3>

            <div className="grid grid-cols-1 gap-4">
              {/* Connection URL */}
              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Connection URL</span>
                </div>
                <div className="bg-card p-2 rounded border text-sm font-mono overflow-x-auto">
                  {`${frontendUrl}/${tenant}`}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Use this URL to connect your bot agent to the OpenAutomate platform.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Block hiển thị label trên, value dưới, có border-b
function DetailBlock({ label, children }: DetailBlockProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="text-base font-medium pb-1 border-b">{children}</div>
    </div>
  )
}
