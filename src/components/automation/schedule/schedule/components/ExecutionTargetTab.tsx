'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Server, Wifi, WifiOff } from 'lucide-react'
import { useLocale } from '@/providers/locale-provider'
import { swrKeys } from '@/lib/config/swr-config'
import { getAllBotAgents } from '@/lib/api/bot-agents'

interface Agent {
  id: string
  name: string
  machineName?: string
  status: string
  description?: string
}

interface ExecutionTargetTabProps {
  selectedAgentId?: string
  onAgentSelect?: (agentId: string) => void
}

export function ExecutionTargetTab({ selectedAgentId, onAgentSelect }: ExecutionTargetTabProps) {
  const { t } = useLocale()
  const [searchTerm, setSearchTerm] = useState('')

  // ✅ SWR for agent data fetching
  const { data: agents = [], error, isLoading } = useSWR(swrKeys.agents(), getAllBotAgents)

  // ✅ Filter out disconnected agents and derive filtered agents during render
  const availableAgents = useMemo(() => {
    // First filter out disconnected/offline agents
    const connectedAgents = agents.filter(
      (agent: Agent) =>
        agent.status &&
        agent.status.toLowerCase() !== 'disconnected' &&
        agent.status.toLowerCase() !== 'offline',
    )

    // Then apply search filter
    if (!searchTerm) return connectedAgents

    return connectedAgents.filter(
      (agent: Agent) =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.machineName?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [agents, searchTerm])

  // ✅ Get status badge props
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
      case 'online':
        return { variant: 'default' as const, icon: Wifi, className: 'bg-green-100 text-green-700' }
      case 'busy':
      case 'running':
        return {
          variant: 'secondary' as const,
          icon: Server,
          className: 'bg-yellow-100 text-yellow-700',
        }
      case 'offline':
      case 'disconnected':
      default:
        return {
          variant: 'destructive' as const,
          icon: WifiOff,
          className: 'bg-red-100 text-red-700',
        }
    }
  }

  const handleAgentSelect = (agentId: string) => {
    if (onAgentSelect) {
      // If the same agent is clicked, deselect it; otherwise select the new one
      const newSelection = selectedAgentId === agentId ? '' : agentId
      onAgentSelect(newSelection)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Execution Agent<span className="text-red-500">*</span>
          </label>
          <div className="text-sm text-muted-foreground">Loading agents...</div>
        </div>
        <div className="h-32 bg-muted/20 rounded-md animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Execution Agent<span className="text-red-500">*</span>
          </label>
          <div className="text-sm text-destructive">Failed to load agents</div>
        </div>
        <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
          <div className="text-sm text-destructive">
            Unable to connect to the server. Please try again.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium">
          Execution Agent<span className="text-red-500">*</span>
        </label>
        <div className="text-sm text-muted-foreground">
          Select an agent to execute this schedule (only connected agents shown)
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('common.search.agentsByNameOrMachine')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Agents Table */}
      <div className="border rounded-md">
        {/* Table Header */}
        <div className="bg-muted/50 grid grid-cols-12 py-3 px-4 text-sm font-medium border-b">
          <div className="col-span-1">Select</div>
          <div className="col-span-4">Agent Name</div>
          <div className="col-span-4">Machine Name</div>
          <div className="col-span-3">Status</div>
        </div>

        {/* Table Body */}
        <div className="max-h-64 overflow-y-auto">
          {availableAgents.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchTerm
                ? 'No available agents found matching your search.'
                : 'No available agents found.'}
              {agents.length > 0 && (
                <div className="text-xs mt-1">Only connected agents are shown for selection.</div>
              )}
            </div>
          ) : (
            availableAgents.map((agent: Agent) => {
              const statusBadge = getStatusBadge(agent.status)
              const StatusIcon = statusBadge.icon
              const isSelected = selectedAgentId === agent.id

              return (
                <div
                  key={agent.id}
                  className={`grid grid-cols-12 py-3 px-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer ${
                    isSelected ? 'bg-primary/10 border-primary/20' : ''
                  }`}
                  onClick={() => handleAgentSelect(agent.id)}
                >
                  <div className="col-span-1 flex items-center">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                  <div className="col-span-4 flex items-center">
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      {agent.description && (
                        <div className="text-xs text-muted-foreground">{agent.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-4 flex items-center">
                    <span className="text-sm">{agent.machineName || 'N/A'}</span>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <Badge variant={statusBadge.variant} className={statusBadge.className}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {agent.status}
                    </Badge>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Selected Agent Info */}
      {selectedAgentId && (
        <div className="grid gap-2">
          <label className="text-sm font-medium">Selected Agent</label>
          <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
            {(() => {
              const selectedAgent = agents.find((a: Agent) => a.id === selectedAgentId)
              if (!selectedAgent)
                return <div className="text-sm text-muted-foreground">Agent not found</div>

              const statusBadge = getStatusBadge(selectedAgent.status)
              const StatusIcon = statusBadge.icon

              return (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selectedAgent.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedAgent.machineName}</div>
                  </div>
                  <Badge variant={statusBadge.variant} className={statusBadge.className}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {selectedAgent.status}
                  </Badge>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-muted-foreground">
        Only connected agents are available for selection. Click an agent to select it for schedule
        execution.
      </div>
    </div>
  )
}
