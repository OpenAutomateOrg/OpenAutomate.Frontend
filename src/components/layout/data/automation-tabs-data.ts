import { BarChart3, LineChart, Package, ShoppingCart, UserPlus, UserX, Users } from 'lucide-react'
import type { Tab } from '@/types/tabs'

const executionsTab: Tab = {
  id: 'executions',
  title: 'Executions',
  icon: Users,
  hasSubTabs: true,
  subTabs: [
    {
      id: 'in-progress',
      title: 'In Progress',
      icon: LineChart,
    },
    {
      id: 'schedules',
      title: 'Schedules',
      icon: UserPlus,
    },
    {
      id: 'historical',
      title: 'Historical',
      icon: UserX,
    },
  ],
}

const schedulesTab: Tab = {
  id: 'schedule',
  title: 'Schedule',
  icon: ShoppingCart,
  hasSubTabs: true,
  subTabs: [
    {
      id: 'sub-schedule',
      title: 'Schedule',
      icon: LineChart,
    },
    {
      id: 'holidays',
      title: 'Holiday Settings',
      icon: UserPlus,
    },
  ],
}

const triggersTab: Tab = {
  id: 'triggers',
  title: 'Triggers',
  icon: Package,
  hasSubTabs: false,
}

const packagesTab: Tab = {
  id: 'packages',
  title: 'Packages',
  icon: BarChart3,
  hasSubTabs: true,
}

// Export all tabs data
export const AutomationTabs: Tab[] = [executionsTab, schedulesTab, triggersTab, packagesTab]
