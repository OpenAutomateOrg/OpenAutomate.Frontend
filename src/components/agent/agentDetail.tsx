'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Copy, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { AgentRow } from './agent'
import { getBotAgentById, regenerateMachineKey } from '@/lib/api/bot-agents'
import { config } from '@/lib/config'
import { useToast } from '@/components/ui/use-toast'
import { useParams } from 'next/navigation'
import { useAgentStatus } from '@/hooks/useAgentStatus'

interface AgentDetailProps {
  id: string
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
  const { toast } = useToast()
  const params = useParams()
  const tenant = params?.tenant as string
  const agentStatuses = useAgentStatus(tenant)
  const [agent, setAgent] = useState<(AgentRow & { machineKey?: string }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Frontend URL for agent connection
  const frontendUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : config.app.url

  const fetchAgentDetails = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const agentData = await getBotAgentById(id)
      // Map the response to match our expected type with botAgentId
      setAgent({
        ...agentData,
        botAgentId: agentData.id, // Ensure botAgentId is present
      })
    } catch (err) {
      console.error('Error fetching agent details:', err)
      setError('Failed to load agent details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAgentDetails()
  }, [id, fetchAgentDetails])

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

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: 'Copied!',
          description: `${label} copied to clipboard`,
        })
      },
      () => {
        toast({
          title: 'Failed to copy',
          description: 'Please try again or copy manually',
          variant: 'destructive',
        })
      },
    )
  }

  const handleRegenerateKey = async () => {
    if (
      !confirm(
        'Are you sure you want to regenerate the machine key? This will disconnect any currently connected agent.',
      )
    ) {
      return
    }

    setRegenerating(true)
    try {
      const result = await regenerateMachineKey(id)
      setAgent((prev) => (prev ? { ...prev, machineKey: result.machineKey } : null))
      toast({
        title: 'Key regenerated',
        description: 'Machine key has been regenerated successfully',
      })
    } catch (err) {
      console.error('Error regenerating key:', err)
      toast({
        title: 'Error',
        description: 'Failed to regenerate machine key',
        variant: 'destructive',
      })
    } finally {
      setRegenerating(false)
    }
  }

  // Determine the real-time status if available
  const realTimeStatus = agentStatuses[id]?.status
  const statusToDisplay = realTimeStatus || agent?.status || ''

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-10">
        <div className="animate-spin text-primary">
          <RefreshCw className="h-10 w-10" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
        <p className="text-red-800 dark:text-red-300">{error}</p>
        <Button variant="outline" className="mt-2" onClick={fetchAgentDetails}>
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
              <DetailBlock label="Last Connected">
                {new Date(agent.lastConnected).toLocaleString()}
              </DetailBlock>
            </div>
          </div>

          {/* Connection Configuration Section */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Connection Configuration</h3>

            <div className="grid grid-cols-1 gap-4">
              {/* Machine Key */}
              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Machine Key</span>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        agent.machineKey && handleCopy(agent.machineKey, 'Machine key')
                      }
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateKey}
                      disabled={regenerating}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${regenerating ? 'animate-spin' : ''}`} />
                      Regenerate
                    </Button>
                  </div>
                </div>
                <div className="bg-card p-2 rounded border text-sm font-mono overflow-x-auto">
                  {agent.machineKey || 'No machine key available'}
                </div>
              </div>

              {/* Connection URL */}
              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Connection URL</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopy(`${frontendUrl}/${tenant}/hubs/botagent`, 'Connection URL')
                    }
                  >
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </div>
                <div className="bg-card p-2 rounded border text-sm font-mono overflow-x-auto">
                  {`${frontendUrl}/${tenant}/hubs/botagent`}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Use this URL to connect your bot agent to the OpenAutomate platform.
                </p>
              </div>

              {/* Configuration Example */}
              <div className="bg-muted p-4 rounded-md">
                <span className="text-sm font-medium block mb-2">Configuration Example</span>
                <div className="bg-card p-3 rounded border text-sm font-mono overflow-x-auto">
                  {`{
  "ServerUrl": "${frontendUrl}/${tenant}",
  "MachineKey": "${agent.machineKey || '[your-machine-key]'}",
  "AutoStart": true,
  "LogLevel": "Information"
}`}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Example configuration for your bot agent. The SignalR connection will be handled
                  through the frontend URL.
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
function DetailBlock({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="text-base font-medium pb-1 border-b">{children}</div>
    </div>
  )
}
