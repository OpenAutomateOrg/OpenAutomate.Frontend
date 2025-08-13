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
import { useLocale } from '@/providers/locale-provider'

// Helper function to render trial management content
const renderTrialManagement = (
  subscription: { hasSubscription?: boolean; userTrialStatus?: TrialStatus } | null,
  isStartingTrial: boolean,
  handleStartTrial: () => void,
  t: (key: string) => string,
) => {
  if (!subscription?.userTrialStatus) {
    return null
  }

  switch (subscription.userTrialStatus) {
    case TrialStatus.Eligible:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('administration.subscription.eligible.description')}
          </p>
          <Button
            onClick={handleStartTrial}
            disabled={isStartingTrial}
            className="w-full transition-all duration-200"
          >
            {isStartingTrial ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('administration.subscription.eligible.activating')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t('administration.subscription.eligible.startTrial')}
              </>
            )}
          </Button>
        </div>
      )

    case TrialStatus.Active:
      return (
        <div className="text-center py-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t('administration.subscription.active.description')}
          </p>
        </div>
      )

    case TrialStatus.Used:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('administration.subscription.used.description')}
          </p>
          <Button className="w-full" onClick={() => subscriptionApi.openCheckoutOverlay()}>
            {t('administration.subscription.used.upgradeButton')}
          </Button>
        </div>
      )

    case TrialStatus.NotEligible:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('administration.subscription.notEligible.description')}
          </p>
          <Button className="w-full" onClick={() => subscriptionApi.openCheckoutOverlay()}>
            {t('administration.subscription.notEligible.upgradeButton')}
          </Button>
        </div>
      )

    default:
      return (
        <div className="text-center py-4">
          <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t('administration.subscription.unknown.description')}
          </p>
        </div>
      )
  }
}

export default function SubscriptionManagement() {
  const { t } = useLocale()
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
      title: t('administration.subscription.toast.startingTrial.title'),
      description: t('administration.subscription.toast.startingTrial.description'),
    })

    try {
      const response = await subscriptionApi.startTrial()
      if (response.success) {
        toast({
          title: t('administration.subscription.toast.trialStarted.title'),
          description: t('administration.subscription.toast.trialStarted.description'),
        })
        // Refresh subscription data
        await mutate()
      } else {
        toast({
          title: t('administration.subscription.toast.trialFailed.title'),
          description:
            response.message || t('administration.subscription.toast.trialFailed.description'),
          variant: 'destructive',
        })
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred while starting your trial.'
      toast({
        title: t('administration.subscription.toast.trialError.title'),
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
          {t('administration.subscription.badges.trial')}
        </Badge>
      )
    }
    if (subscription?.isActive) {
      return (
        <Badge variant="default" className="ml-2">
          {t('administration.subscription.badges.active')}
        </Badge>
      )
    }
    return (
      <Badge variant="destructive" className="ml-2">
        {t('administration.subscription.badges.expired')}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('administration.subscription.loading.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('administration.subscription.loading.description')}
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
          <h1 className="text-3xl font-bold tracking-tight">
            {t('administration.subscription.title')}
          </h1>
          <p className="text-muted-foreground">{t('administration.subscription.description')}</p>
        </div>
      </div>

      {/* Current Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('administration.subscription.cards.status')}
            </CardTitle>
            {getStatusIcon()}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {subscription?.status || t('administration.subscription.placeholders.noSubscription')}
              {subscription?.hasSubscription && getStatusBadge()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('administration.subscription.cards.plan')}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscription?.planName || t('administration.subscription.placeholders.noPlan')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('administration.subscription.cards.daysRemaining')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscription?.daysRemaining ??
                t('administration.subscription.placeholders.notAvailable')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('administration.subscription.cards.trialStatus')}
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscription?.userTrialStatus === TrialStatus.Eligible
                ? t('administration.subscription.placeholders.available')
                : subscription?.userTrialStatus === TrialStatus.Used
                  ? t('administration.subscription.placeholders.used')
                  : subscription?.userTrialStatus === TrialStatus.Active
                    ? t('administration.subscription.placeholders.active')
                    : t('administration.subscription.placeholders.notAvailableStatus')}
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
              {t('administration.subscription.currentSubscription.title')}
            </CardTitle>
            <CardDescription>
              {t('administration.subscription.currentSubscription.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription?.hasSubscription ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">
                    {t('administration.subscription.currentSubscription.status')}
                  </span>
                  <div className="flex items-center">
                    {subscription.status}
                    {getStatusBadge()}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium">
                    {t('administration.subscription.currentSubscription.plan')}
                  </span>
                  <span>{subscription.planName}</span>
                </div>

                {subscription.isInTrial && subscription.trialEndsAt && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      {t('administration.subscription.currentSubscription.trialEnds')}
                    </span>
                    <span>{format(new Date(subscription.trialEndsAt + 'Z'), 'PPp')}</span>
                  </div>
                )}

                {subscription.renewsAt && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      {t('administration.subscription.currentSubscription.nextBilling')}
                    </span>
                    <span>{format(new Date(subscription.renewsAt + 'Z'), 'PP')}</span>
                  </div>
                )}

                {subscription.isActive && (
                  <div className="pt-2">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => subscriptionApi.openCustomerPortal()}
                    >
                      {t('administration.subscription.currentSubscription.manageBilling')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('administration.subscription.currentSubscription.noActiveSubscription')}
                </p>
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
                {t('administration.subscription.freeTrial.title')}
              </CardTitle>
              <CardDescription>
                {t('administration.subscription.freeTrial.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderTrialManagement(subscription, isStartingTrial, handleStartTrial, t)}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('administration.subscription.billingHistory.title')}</CardTitle>
          <CardDescription>
            {t('administration.subscription.billingHistory.description')}
          </CardDescription>
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
                  <TableHead>
                    {t('administration.subscription.billingHistory.tableHeaders.date')}
                  </TableHead>
                  <TableHead>
                    {t('administration.subscription.billingHistory.tableHeaders.status')}
                  </TableHead>
                  <TableHead className="text-right">
                    {t('administration.subscription.billingHistory.tableHeaders.amount')}
                  </TableHead>
                  <TableHead>
                    {t('administration.subscription.billingHistory.tableHeaders.invoice')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(paymentsData?.items ?? []).map((p: PaymentItem) => (
                  <TableRow key={p.orderId}>
                    <TableCell>{format(new Date(p.paymentDate), 'PP')}</TableCell>
                    <TableCell>
                      {p.isRefunded
                        ? t('administration.subscription.billingHistory.statuses.refunded')
                        : t('administration.subscription.billingHistory.statuses.paid')}
                    </TableCell>
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
                        {t('administration.subscription.billingHistory.view')}{' '}
                        <ExternalLink className="h-4 w-4" />
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
            {t('administration.subscription.accountInformation.title')}
          </CardTitle>
          <CardDescription>
            {t('administration.subscription.accountInformation.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">
                  {t('administration.subscription.accountInformation.accountEmail')}
                </span>
                <span className="text-sm">{userProfile?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">
                  {t('administration.subscription.accountInformation.fullName')}
                </span>
                <span className="text-sm">
                  {userProfile
                    ? `${userProfile.firstName} ${userProfile.lastName}`
                    : t('administration.subscription.placeholders.notAvailable')}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">
                  {t('administration.subscription.accountInformation.trialUsed')}
                </span>
                <span className="text-sm">
                  {userProfile?.hasUsedTrial ? t('common.yes') : t('common.no')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">
                  {t('administration.subscription.accountInformation.organizationUnits')}
                </span>
                <span className="text-sm">{userProfile?.organizationUnits.length || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
