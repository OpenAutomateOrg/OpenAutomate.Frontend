'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useSubscription } from '@/hooks/use-subscription'
import { useToast } from '@/components/ui/use-toast'

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const { subscription, mutate } = useSubscription()
  const { toast } = useToast()

  useEffect(() => {
    // Refresh subscription status when landing on success page
    // This ensures we get the latest status after webhook processing
    const refreshSubscription = async () => {
      try {
        await mutate()
        toast({
          title: 'Payment Successful!',
          description: 'Your subscription has been activated. Thank you for your purchase.',
          variant: 'success',
        })
      } catch (error) {
        console.error('Error refreshing subscription:', error)
      }
    }

    refreshSubscription()
  }, [mutate, toast])
  // Auto-redirect to Orchestrator after refreshing subscription
  useEffect(() => {
    let mounted = true
    const redirectAfter = async () => {
      try {
        await mutate()
        if (!mounted) return
        router.push('../dashboard')
      } catch (e) {
        console.error('Redirect after payment failed:', e)
      }
    }
    redirectAfter()
    return () => {
      mounted = false
    }
  }, [mutate, router])

  const handleGoToSubscription = () => {
    router.push('../administration/subscription')
  }

  const handleGoToDashboard = () => {
    router.push('../dashboard')
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase. Your subscription is being activated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription?.isActive ? (
            <div className="text-center text-sm text-green-600">
              ✅ Subscription activated successfully
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing your subscription...
            </div>
          )}

          <div className="space-y-2">
            <Button className="w-full" onClick={handleGoToSubscription}>
              View Subscription Details
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoToDashboard}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
