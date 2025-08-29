import { Metadata } from 'next'
import PackageDetail from '@/components/automation/package/package-detail'

export const metadata: Metadata = {
  title: 'Package Details',
  description: 'View automation package details and versions',
}

export default function PackageDetailPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      <PackageDetail />
    </div>
  )
}
