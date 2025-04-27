import { FileKey2 } from 'lucide-react'
import type { Tab } from '@/types/tabs'

const assetsTab: Tab = {
  id: 'asset',
  title: 'Asset',
  icon: FileKey2,
  hasSubTabs: false,
}

export const AssetTab: Tab[] = [assetsTab]
