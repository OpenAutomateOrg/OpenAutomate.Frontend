import { Metadata } from 'next'
import PackageInterface from '@/components/automation/package/package'

export const metadata: Metadata = {
  title: 'Automation Packages',
  description: 'Manage your automation packages and versions',
}

export default function PackagePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      <PackageInterface />
    </div>
  )
}
