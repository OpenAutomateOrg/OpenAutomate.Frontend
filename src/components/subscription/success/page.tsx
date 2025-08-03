'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSubscription } from '@/hooks/use-subscription'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const { mutate } = useSubscription()
  const [countdown, setCountdown] = useState(5)

  const getCurrentTenant = (): string => {
    if (typeof window === 'undefined') return ''
    const path = window.location.pathname
    const segments = path.split('/').filter(Boolean)
    return segments.length > 0 ? segments[0] : ''
  }
  const tenant = getCurrentTenant()

  useEffect(() => {
    // Immediately refresh subscription data
    mutate()

    // Start countdown and redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push(`/${tenant}/dashboard`)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [mutate, router, tenant])

  return (
    <div className="container mx-auto py-16">
      <div className="max-w-md mx-auto">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your subscription is now active. Welcome to the Pro plan!
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                You now have access to all Pro features and unlimited usage.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard in {countdown} seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
