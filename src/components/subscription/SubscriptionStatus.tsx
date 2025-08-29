'use client'

import { useState } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
// merged import below for subscriptionApi and PaymentItem
import { TrialStatus } from '@/types/subscription'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import useSWR from 'swr'
import { swrKeys } from '@/lib/config/swr-config'
import { subscriptionApi, type PaymentItem } from '@/lib/api/subscription'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { parseUtcDate, formatUtcToLocal, safeFormatRelativeTime } from '@/lib/utils/datetime'

// Helper functions moved outside component to reduce complexity
const getStatusIcon = (subscription: any) => {
  if (subscription.isActive && subscription.isInTrial) {
    return <Clock className="h-5 w-5 text-blue-500" />
  }
  if (subscription.isActive) {
    return <CheckCircle className="h-5 w-5 text-green-500" />
  }
  return <AlertCircle className="h-5 w-5 text-red-500" />
}

const getStatusBadge = (subscription: any) => {
  if (subscription.isInTrial) {
    return <Badge variant="secondary">Trial</Badge>
  }
  if (subscription.isActive) {
    return <Badge variant="default">Active</Badge>
  }
  return <Badge variant="destructive">Expired</Badge>
}

const getExpirationText = (subscription: any) => {
  if (subscription.isInTrial && subscription.trialEndsAt) {
    const trialEndTime = parseUtcDate(subscription.trialEndsAt)
    if (!trialEndTime) return 'Trial end date pending'

    const now = new Date()
    const prefix = trialEndTime > now ? 'Trial expires' : 'Trial expired'
    return safeFormatRelativeTime(subscription.trialEndsAt, {
      prefix,
      fallback: 'Trial end date pending',
    })
  }

  if (subscription.isActive && subscription.renewsAt) {
    return safeFormatRelativeTime(subscription.renewsAt, {
      prefix: 'Renews',
      fallback: 'Renewal date pending',
    })
  }

  if (subscription.endsAt) {
    return safeFormatRelativeTime(subscription.endsAt, {
      prefix: 'Ended',
      fallback: 'End date unknown',
    })
  }

  return ''
}

// Component for eligible trial status
const EligibleTrialCard = ({ handleStartTrial, isStartingTrial }: { handleStartTrial: () => void, isStartingTrial: boolean }) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Start Your Free Trial
      </CardTitle>
      <CardDescription>
        Get full access to all features with a free trial period.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Button
        onClick={handleStartTrial}
        disabled={isStartingTrial}
        className="w-full transition-all duration-200"
      >
        {isStartingTrial ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Activating Trial...
          </>
        ) : (
          <>
            <Clock className="mr-2 h-4 w-4" />
            Start Free Trial
          </>
        )}
      </Button>
    </CardContent>
  </Card>
)

// Component for active trial status
const ActiveTrialCard = ({ subscription, paymentsData }: { subscription: any, paymentsData: any }) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon(subscription)}
          {subscription.planName} Plan
        </div>
        {getStatusBadge(subscription)}
      </CardTitle>
      <CardDescription>{getExpirationText(subscription)}</CardDescription>
    </CardHeader>
    {paymentsData?.items?.length ? (
      <CardContent>
        <div className="text-sm font-medium mb-2">Recent invoices</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentsData.items.map((p: PaymentItem) => (
              <TableRow key={p.orderId}>
                <TableCell>
                  {formatUtcToLocal(p.paymentDate, { dateStyle: 'short' })}
                </TableCell>
                <TableCell>{p.isRefunded ? 'Refunded' : 'Paid'}</TableCell>
                <TableCell className="text-right">
                  {p.amount.toLocaleString(undefined, {
                    style: 'currency',
                    currency: p.currency,
                  })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => subscriptionApi.openInvoice(p.orderId)}
                    className="inline-flex items-center gap-2"
                  >
                    View <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    ) : null}
  </Card>
)

// Component for used trial status
const UsedTrialCard = () => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-orange-500" />
        Trial Already Used
      </CardTitle>
      <CardDescription>
        You have already used your free trial. Upgrade to continue using all features.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Button className="w-full" onClick={() => subscriptionApi.openCheckoutOverlay()}>
        Upgrade to Pro
      </Button>
    </CardContent>
  </Card>
)

// Component for not eligible trial status
const NotEligibleTrialCard = () => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-orange-500" />
        Trial Not Available
      </CardTitle>
      <CardDescription>
        Free trial is only available on your first organization unit. Upgrade to access
        premium features.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Button className="w-full" onClick={() => subscriptionApi.openCheckoutOverlay()}>
        Upgrade to Pro
      </Button>
    </CardContent>
  </Card>
)

export function SubscriptionStatus() {
  const { subscription, isLoading, mutate } = useSubscription()
  const [isStartingTrial, setIsStartingTrial] = useState(false)
  const { toast } = useToast()
  // Optional: lightweight recent payments preview for user dashboard
  const { data: paymentsData } = useSWR(swrKeys.subscription(), () =>
    subscriptionApi.getPayments(1, 5),
  )

  const handleStartTrial = async () => {
    if (isStartingTrial) return // Prevent multiple clicks

    setIsStartingTrial(true)

    // Show immediate feedback
    toast({
      title: 'Starting Trial...',
      description: 'Please wait while we activate your free trial.',
    })

    try {
      const response = await subscriptionApi.startTrial()
      if (response.success) {
        toast({
          title: 'Trial Started Successfully!',
          description: 'Your free trial has been activated. Refreshing subscription status...',
        })
        // Refresh subscription data
        await mutate()
      } else {
        toast({
          title: 'Failed to Start Trial',
          description: response.message || 'Unable to start trial. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred while starting your trial.'
      toast({
        title: 'Error Starting Trial',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsStartingTrial(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  // If subscription is active (paid or trial), hide any trial upgrade prompts
  if (subscription?.isActive) {
    // Determine if this is a trial or paid subscription
    const isTrialActive = subscription.isInTrial
    const planTitle = isTrialActive ? 'Trial' : `${subscription.planName || 'Pro'} Plan Active`
    const iconColor = isTrialActive ? 'text-blue-500' : 'text-green-500'

    // Determine the appropriate description based on trial vs paid status
    let description = null
    if (isTrialActive && subscription.trialEndsAt) {
      description = safeFormatRelativeTime(subscription.trialEndsAt, {
        prefix: 'Expires',
        fallback: 'Trial end date pending'
      })
    } else if (!isTrialActive && subscription.renewsAt) {
      description = safeFormatRelativeTime(subscription.renewsAt, {
        prefix: 'Renews',
        fallback: 'Renewal date pending'
      })
    }

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isTrialActive ? (
              <Clock className={`h-5 w-5 ${iconColor}`} />
            ) : (
              <CheckCircle className={`h-5 w-5 ${iconColor}`} />
            )}
            {planTitle}
          </CardTitle>
          {description && (
            <CardDescription>
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => subscriptionApi.openCustomerPortal()}
          >
            Manage Billing
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!subscription?.userTrialStatus) {
    // Fallback for missing userTrialStatus (shouldn't happen with new API)
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-500" />
            Loading...
          </CardTitle>
          <CardDescription>Checking subscription status...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Use the new explicit UserTrialStatus to determine what to render
  switch (subscription.userTrialStatus) {
    case TrialStatus.Eligible:
      return <EligibleTrialCard handleStartTrial={handleStartTrial} isStartingTrial={isStartingTrial} />

    case TrialStatus.Active:
      return <ActiveTrialCard subscription={subscription} paymentsData={paymentsData} />

    case TrialStatus.Used:
      return <UsedTrialCard />

    case TrialStatus.NotEligible:
      return <NotEligibleTrialCard />

    default:
      // Fallback for unknown status
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-500" />
              Unknown Status
            </CardTitle>
            <CardDescription>
              Unable to determine subscription status. Please refresh the page.
            </CardDescription>
          </CardHeader>
        </Card>
      )
  }
}
