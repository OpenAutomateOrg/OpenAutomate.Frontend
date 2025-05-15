'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AgentRow } from './agent'

interface AgentDetailProps {
  id: string
}

export default function AgentDetail({ id }: AgentDetailProps) {
  const router = useRouter()
  const [agent, setAgent] = useState<AgentRow | null>(null)

  useEffect(() => {
    // TODO: Replace with actual API call
    const mockAgent: AgentRow = {
      id,
      name: 'Agent 2',
      agentGroup: { id: 'group-1', name: 'Group 1' },
      machineName: 'Machine name',
      agent: 'Agent',
      type: 'PRODUCTION',
      createdBy: 'admin',
      description: '',
      key: '2c5ce41f-c9a0-8224-cdb7-0a0dbdde0d0f',
      machineUsername: 'Admin',
      status: 'Disconnected',
      version: '',
    }
    setAgent(mockAgent)
  }, [id])

  const handleBack = () => {
    router.back()
  }

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  if (!agent) {
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
              <DetailBlock label="Agent Group">
                <Link href="#" className="text-blue-600 hover:underline">
                  {agent.agentGroup?.name}
                </Link>
              </DetailBlock>
              <DetailBlock label="Name">{agent.name}</DetailBlock>
              <DetailBlock label="Machine name">{agent.machineName}</DetailBlock>
              <DetailBlock label="Agent">{agent.agent}</DetailBlock>
              <DetailBlock label="Type">{agent.type}</DetailBlock>
              <DetailBlock label="Created By">{agent.createdBy}</DetailBlock>
              <DetailBlock label="Description">{agent.description}</DetailBlock>
            </div>
            <div className="space-y-4">
              <DetailBlock label="Key">
                <div className="flex items-center gap-2">
                  <span className="truncate">{agent.key}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(agent.key)}
                    title="Copy"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </DetailBlock>
              <DetailBlock label="Machine Username">{agent.machineUsername}</DetailBlock>
              <DetailBlock label="Admin">{agent.createdBy}</DetailBlock>
              <DetailBlock label="Status">
                <Badge
                  variant="outline"
                  className={
                    agent.status === 'Disconnected'
                      ? 'bg-red-100 text-red-600 border-none'
                      : 'bg-green-100 text-green-600 border-none'
                  }
                >
                  {agent.status}
                </Badge>
              </DetailBlock>
              <DetailBlock label="Version">{agent.version}</DetailBlock>
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
