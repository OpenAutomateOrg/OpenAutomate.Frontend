import SubscriptionManagement from '@/components/administration/subscription/subscription-management'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Subscription Management',
  description: 'Manage your organization subscription and billing',
}

export default function SubscriptionPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <SubscriptionManagement />
    </div>
  )
}