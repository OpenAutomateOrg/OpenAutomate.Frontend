import { Metadata } from 'next'
import PackageInterface from '@/components/automation/package/package'

export const metadata: Metadata = {
  title: 'Automation Packages',
  description: 'Manage your automation packages and versions',
}

export default function PackagePage() {
  return (
    <div className="h-full">
      <PackageInterface />
    </div>
  )
}
