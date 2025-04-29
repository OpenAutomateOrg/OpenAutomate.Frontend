import type { LucideIcon } from 'lucide-react'

export interface TableRow {
  id: number | string
  [key: string]: string | number | boolean
}

export interface SubTab {
  id: string
  title: string
  icon?: LucideIcon
  tableData?: TableRow[]
  columns?: Column[]
}

export interface Tab {
  id: string
  title: string
  icon?: LucideIcon
  hasSubTabs?: boolean
  subTabs?: SubTab[]
  tableData?: TableRow[]
  columns?: Column[]
}

export interface Column {
  key: string
  label: string
  sortable?: boolean
}
