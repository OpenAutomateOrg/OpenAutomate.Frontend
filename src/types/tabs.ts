import type { LucideIcon } from 'lucide-react'

export interface SubTab {
  id: string
  title: string
  icon: LucideIcon
}

export interface Tab {
  id: string
  title: string
  icon: LucideIcon
  hasSubTabs: boolean
  subTabs?: SubTab[]
}
