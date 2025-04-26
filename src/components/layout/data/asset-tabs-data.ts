import { Package } from 'lucide-react'
import type { Tab } from '@/types/tabs'

const assetsTab: Tab = {
  id: 'asset',
  title: 'Asset',
  icon: Package,
  hasSubTabs: false,
}

export const AssetTab: Tab[] = [assetsTab]
