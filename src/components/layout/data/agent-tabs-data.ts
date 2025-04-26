import { BarChart3, Package } from 'lucide-react'
import type { Tab } from '@/types/tabs'

const agentsTab: Tab = {
  id: 'agent',
  title: 'Agent',
  icon: Package,
  hasSubTabs: false,
}

const agentGroupTab: Tab = {
  id: 'agent-group',
  title: 'Agent Group',
  icon: BarChart3,
  hasSubTabs: false,
}

export const AgentTabs: Tab[] = [agentsTab, agentGroupTab]
