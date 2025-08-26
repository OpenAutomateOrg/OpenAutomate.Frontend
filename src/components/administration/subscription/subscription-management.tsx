'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useSubscription } from '@/hooks/use-subscription'
// merged import below for subscriptionApi and PaymentItem
import { TrialStatus } from '@/types/subscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Calendar,
  Users,
  Building2,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { parseUtcDate } from '@/lib/utils/datetime'
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
import { ExternalLink } from 'lucide-react'

// Helper function to render trial management content
const renderTrialManagement = (
  subscription: { hasSubscription?: boolean; userTrialStatus?: TrialStatus } | null,
  isStartingTrial: boolean,
  handleStartTrial: () => void,
) => {
  if (!subscription?.userTrialStatus) {
    return null
  }

  switch (subscription.userTrialStatus) {
    case TrialStatus.Eligible:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You can start a free trial to explore all premium features.
          </p>
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
                <Sparkles className="mr-2 h-4 w-4" />
                Start Free Trial
              </>
            )}
          </Button>
        </div>
      )

    case TrialStatus.Active:
      return (
        <div className="text-center py-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">You have an active trial subscription</p>
        </div>
      )

    case TrialStatus.Used:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You have already used your free trial. Upgrade to continue using Pro features.
          </p>
          <Button className="w-full" onClick={() => subscriptionApi.openCheckoutOverlay()}>
            Upgrade to Pro
          </Button>
        </div>
      )

    case TrialStatus.NotEligible:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Free trial is only available on your first organization unit. Upgrade to access Pro
            features.
          </p>
          <Button className="w-full" onClick={() => subscriptionApi.openCheckoutOverlay()}>
            Upgrade to Pro
          </Button>
        </div>
      )

    default:
      return (
        <div className="text-center py-4">
          <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Unable to determine trial status</p>
        </div>
      )
  }
}

export default function SubscriptionManagement() {
  const { userProfile } = useAuth()
  const { subscription, isLoading, mutate } = useSubscription()
  const [isStartingTrial, setIsStartingTrial] = useState(false)
  const { toast } = useToast()

  // Billing history (SWR per guide, no manual useEffect)
  const { data: paymentsData, isLoading: isPaymentsLoading } = useSWR(swrKeys.subscription(), () =>
    subscriptionApi.getPayments(1, 50),
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

  const getStatusIcon = () => {
    if (subscription?.isActive && subscription?.isInTrial) {
      return <Clock className="h-6 w-6 text-blue-500" />
    }
    if (subscription?.isActive) {
      return <CheckCircle className="h-6 w-6 text-green-500" />
    }
    return <AlertCircle className="h-6 w-6 text-red-500" />
  }

  const getStatusBadge = () => {
    if (subscription?.isInTrial) {
      return (
        <Badge variant="secondary" className="ml-2">
          Trial
        </Badge>
      )
    }
    if (subscription?.isActive) {
      return (
        <Badge variant="default" className="ml-2">
          Active
        </Badge>
      )
    }
    return (
      <Badge variant="destructive" className="ml-2">
        Expired
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
            <p className="text-muted-foreground">
              Manage your organization&apos;s subscription and billing
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
        </div>
      </div>

      {/* Current Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {getStatusIcon()}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {subscription?.status || 'No Subscription'}
              {subscription?.hasSubscription && getStatusBadge()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscription?.planName || 'No Plan'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscription?.daysRemaining ?? 'N/A'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Status</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscription?.userTrialStatus === TrialStatus.Eligible
                ? 'Available'
                : subscription?.userTrialStatus === TrialStatus.Used
                  ? 'Used'
                  : subscription?.userTrialStatus === TrialStatus.Active
                    ? 'Active'
                    : 'Not Available'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Current Subscription
            </CardTitle>
            <CardDescription>Details about your current subscription status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription?.hasSubscription ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <div className="flex items-center">
                    {subscription.status}
                    {getStatusBadge()}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Plan:</span>
                  <span>{subscription.planName}</span>
                </div>

                {subscription.isInTrial && subscription.trialEndsAt && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Trial Ends:</span>
                    <span>
                      {(() => {
                        const date = parseUtcDate(subscription.trialEndsAt)
                        return date ? format(date, 'PPp') : 'Date pending'
                      })()}
                    </span>
                  </div>
                )}

                {subscription.renewsAt && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Next Billing:</span>
                    <span>
                      {(() => {
                        const date = parseUtcDate(subscription.renewsAt)
                        return date ? format(date, 'PP') : 'Date pending'
                      })()}
                    </span>
                  </div>
                )}

                {subscription.isActive && (
                  <div className="pt-2">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => subscriptionApi.openCustomerPortal()}
                    >
                      Manage Billing
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active subscription</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trial Management - hidden when subscription is active */}
        {!subscription?.isActive && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Free Trial
              </CardTitle>
              <CardDescription>Start your free trial to access all features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderTrialManagement(subscription, isStartingTrial, handleStartTrial)}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your recent invoices and receipts</CardDescription>
        </CardHeader>
        <CardContent>
          {isPaymentsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
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
                {(paymentsData?.items ?? []).map((p: PaymentItem) => (
                  <TableRow key={p.orderId}>
                    <TableCell>{format(new Date(p.paymentDate), 'PP')}</TableCell>
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
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Information about your account and trial usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account Email:</span>
                <span className="text-sm">{userProfile?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Full Name:</span>
                <span className="text-sm">
                  {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'N/A'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Trial Used:</span>
                <span className="text-sm">{userProfile?.hasUsedTrial ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Organization Units:</span>
                <span className="text-sm">{userProfile?.organizationUnits.length || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
