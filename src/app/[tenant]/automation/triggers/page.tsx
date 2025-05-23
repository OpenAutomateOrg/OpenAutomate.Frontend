import TriggersInterface from '@/components/automation/triggers/triggers'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Automation',
  description: 'Agent management page',
}

export default function ExcutionsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      <TriggersInterface />
    </div>
  )
}
