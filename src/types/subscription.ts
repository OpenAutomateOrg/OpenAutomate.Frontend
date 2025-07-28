export interface SubscriptionStatus {
  hasSubscription: boolean
  isActive: boolean
  isInTrial: boolean
  status: string
  planName: string
  trialEndsAt?: string
  renewsAt?: string
  endsAt?: string
  daysRemaining?: number
  isEligibleForTrial: boolean
}

export interface StartTrialResponse {
  success: boolean
  message?: string
}