export enum TrialStatus {
  Eligible = 'Eligible',
  Active = 'Active',
  Used = 'Used',
  NotEligible = 'NotEligible',
}

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
  userTrialStatus: TrialStatus
}

export interface StartTrialResponse {
  success: boolean
  message?: string
}
