import { Group, Bot } from 'lucide-react'
import type { Tab } from '@/types/tabs'

const agentsTab: Tab = {
  id: 'agent',
  title: 'Agent',
  icon: Bot,
  hasSubTabs: false,
}

const agentGroupTab: Tab = {
  id: 'agent-group',
  title: 'Agent Group',
  icon: Group,
  hasSubTabs: false,
}

export const AgentTabs: Tab[] = [agentsTab, agentGroupTab]
