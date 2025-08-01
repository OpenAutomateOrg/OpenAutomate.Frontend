'use client'

import { useState } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { subscriptionApi } from '@/lib/api/subscription'
import { TrialStatus } from '@/types/subscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { formatDistanceToNow } from 'date-fns'

export function SubscriptionStatus() {
  const { subscription, isLoading, mutate } = useSubscription()
  const [isStartingTrial, setIsStartingTrial] = useState(false)
  const { toast } = useToast()

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
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while starting your trial.'
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

  if (!subscription?.userTrialStatus) {
    // Fallback for missing userTrialStatus (shouldn't happen with new API)
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-500" />
            Loading...
          </CardTitle>
          <CardDescription>
            Checking subscription status...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Helper functions for subscription display
  const getStatusIcon = () => {
    if (subscription.isActive && subscription.isInTrial) {
      return <Clock className="h-5 w-5 text-blue-500" />
    }
    if (subscription.isActive) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    return <AlertCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = () => {
    if (subscription.isInTrial) {
      return <Badge variant="secondary">Trial</Badge>
    }
    if (subscription.isActive) {
      return <Badge variant="default">Active</Badge>
    }
    return <Badge variant="destructive">Expired</Badge>
  }

  const getExpirationText = () => {
    if (subscription.isInTrial && subscription.trialEndsAt) {
      // Parse as UTC and convert to local time for display
      const trialEndTime = new Date(subscription.trialEndsAt + 'Z') // Add Z to ensure UTC parsing
      const now = new Date()
      
      if (trialEndTime > now) {
        const expiresIn = formatDistanceToNow(trialEndTime, { addSuffix: true })
        return `Trial expires ${expiresIn}`
      } else {
        const expiredTime = formatDistanceToNow(trialEndTime, { addSuffix: true })
        return `Trial expired ${expiredTime}`
      }
    }
    if (subscription.isActive && subscription.renewsAt) {
      const renewTime = new Date(subscription.renewsAt + 'Z')
      const renewsIn = formatDistanceToNow(renewTime, { addSuffix: true })
      return `Renews ${renewsIn}`
    }
    if (subscription.endsAt) {
      const endTime = new Date(subscription.endsAt + 'Z')
      const endedTime = formatDistanceToNow(endTime, { addSuffix: true })
      return `Ended ${endedTime}`
    }
    return ''
  }

  // Use the new explicit UserTrialStatus to determine what to render
  switch (subscription.userTrialStatus) {
    case TrialStatus.Eligible:
      return (
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

    case TrialStatus.Active:
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                {subscription.planName} Plan
              </div>
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>
              {getExpirationText()}
            </CardDescription>
          </CardHeader>
        </Card>
      )

    case TrialStatus.Used:
      return (
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
            <Button className="w-full">
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      )

    case TrialStatus.NotEligible:
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Trial Not Available
            </CardTitle>
            <CardDescription>
              Free trial is only available on your first organization unit. Upgrade to access premium features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      )

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