export interface SystemStatistics {
  totalOrganizationUnits: number
  totalBotAgents: number
  totalAssets: number
  totalAutomationPackages: number
  totalExecutions: number
  totalSchedules: number
  totalUsers: number
}

export interface RevenueStatistics {
  totalRevenue: number
  monthlyRecurringRevenue: number
  currentMonthRevenue: number
  previousMonthRevenue: number
  revenueGrowthPercentage: number
  activeSubscriptions: number
  trialSubscriptions: number
  totalPayments: number
  averageRevenuePerUser: number
  totalSubscribedOrganizations: number
  lastUpdated: string
}
