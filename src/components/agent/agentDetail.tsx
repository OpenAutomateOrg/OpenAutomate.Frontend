'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Copy, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AgentRow } from './agent'
import { useAgentApi, AgentResponse, AgentApiError, AgentApiErrorType } from '@/lib/api/agent'

interface AgentDetailProps {
  id: string
}

export default function AgentDetail({ id }: AgentDetailProps) {
  const router = useRouter()
  const agentApi = useAgentApi()
  const [agent, setAgent] = useState<AgentResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    const loadAgentDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const agentDetails = await agentApi.getById(id)
        setAgent(agentDetails)
      } catch (error) {
        console.error('Error loading agent details:', error)
        if (error instanceof AgentApiError) {
          switch (error.type) {
            case AgentApiErrorType.NOT_FOUND:
              setError(`Agent not found. The agent with ID ${id} may have been deleted.`)
              break
            case AgentApiErrorType.AUTHENTICATION:
              setError('You do not have permission to view this agent.')
              break
            case AgentApiErrorType.NETWORK:
              setError('Network error. Please check your connection and try again.')
              break
            default:
              setError(`Error loading agent: ${error.message}`)
          }
        } else {
          setError('An unexpected error occurred. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadAgentDetails()
  }, [id, agentApi])

  const handleBack = () => {
    router.back()
  }

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  const handleRegenerateKey = async () => {
    if (!agent) return
    
    try {
      setIsLoading(true)
      const updatedAgent = await agentApi.regenerateKey(id)
      setAgent(updatedAgent)
      // Show the key after regenerating
      setShowKey(true)
    } catch (error) {
      console.error('Error regenerating key:', error)
      if (error instanceof AgentApiError) {
        setError(`Failed to regenerate key: ${error.message}`)
      } else {
        setError('An unexpected error occurred while regenerating the key.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Mask the key to show only the last 4 characters
  const getMaskedKey = (key?: string) => {
    if (!key) return '••••••••••••'
    return showKey ? key : '•'.repeat(key.length - 4) + key.substring(key.length - 4)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="border rounded-md shadow-sm">
          <CardContent className="p-6 flex justify-center items-center h-40">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto mb-4"></div>
              <p>Loading agent details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="border rounded-md shadow-sm">
          <CardHeader className="flex items-center justify-between border-b p-4">
            <Button variant="ghost" size="sm" className="gap-1" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              <p className="font-medium mb-2">Error</p>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="border rounded-md shadow-sm">
          <CardHeader className="flex items-center justify-between border-b p-4">
            <Button variant="ghost" size="sm" className="gap-1" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-500">Agent not found</p>
          </CardContent>
        </Card>
      </div>
    )
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
              <DetailBlock label="Status">
                <Badge
                  variant="outline"
                  className={
                    agent.status === 'Active' || agent.status === 'Online'
                      ? 'bg-green-100 text-green-600 border-none'
                      : 'bg-red-100 text-red-600 border-none'
                  }
                >
                  {agent.status}
                </Badge>
              </DetailBlock>
              <DetailBlock label="Last Connected">
                {agent.lastConnected 
                  ? new Date(agent.lastConnected).toLocaleString() 
                  : 'Never'}
              </DetailBlock>
              <DetailBlock label="Is Active">
                {agent.isActive ? 'Yes' : 'No'}
              </DetailBlock>
            </div>
            <div className="space-y-4">
              <DetailBlock label="Machine Key">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm truncate">
                    {getMaskedKey(agent.machineKey)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowKey(!showKey)}
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  {agent.machineKey && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(agent.machineKey!)}
                      title="Copy"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateKey}
                    disabled={isLoading}
                  >
                    Regenerate Key
                  </Button>
                </div>
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
