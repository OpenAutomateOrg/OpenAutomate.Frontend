import { Metadata } from 'next'
import AgentInterface from '@/components/agent/agent'

export const metadata: Metadata = {
  title: 'Agent',
  description: 'Agent management page',
}

export default function AgentPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      <AgentInterface />
    </div>
  )
}
