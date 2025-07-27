import { Metadata } from 'next'
import PackageDetail from '@/components/automation/package/package-detail'

export const metadata: Metadata = {
  title: 'Package Details',
  description: 'View automation package details and versions',
}

export default function PackageDetailPage() {
  return (
    <div className="h-full">
      <PackageDetail />
    </div>
  )
}
