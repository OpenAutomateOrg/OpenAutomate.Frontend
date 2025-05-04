import {
  LineChart,
  Package,
  History,
  FileTerminal,
  Loader,
  CalendarSync,
  TentTree,
  ScanEye,
} from 'lucide-react'
import type { Tab } from '@/types/tabs'

const executionsTab: Tab = {
  id: 'executions',
  title: 'Executions',
  icon: FileTerminal,
  hasSubTabs: true,
  subTabs: [
    {
      id: 'in-progress',
      title: 'In Progress',
      icon: Loader,
    },
    {
      id: 'schedules',
      title: 'Schedules',
      icon: CalendarSync,
    },
    {
      id: 'historical',
      title: 'Historical',
      icon: History,
    },
  ],
}

const schedulesTab: Tab = {
  id: 'schedule',
  title: 'Schedule',
  icon: CalendarSync,
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
      icon: TentTree,
    },
  ],
}

const triggersTab: Tab = {
  id: 'triggers',
  title: 'Triggers',
  icon: ScanEye,
  hasSubTabs: false,
}

const packagesTab: Tab = {
  id: 'packages',
  title: 'Packages',
  icon: Package,
  hasSubTabs: true,
}

// Export all tabs data
export const AutomationTabs: Tab[] = [executionsTab, schedulesTab, triggersTab, packagesTab]
