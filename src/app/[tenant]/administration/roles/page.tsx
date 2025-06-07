import RolesInterface from '@/components/administration/roles/roles'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Automation',
  description: 'Agent management page',
}

export default function RolesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      <RolesInterface />
    </div>
  )
}
