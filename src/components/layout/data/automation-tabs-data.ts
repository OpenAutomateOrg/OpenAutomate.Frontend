import { Bot, Settings, Users, FileText, Clock } from 'lucide-react'
import type { Tab } from '@/types/tabs'

export const AutomationTabs: Tab[] = [
  {
    id: 'tasks',
    title: 'Tasks',
    icon: Bot,
    hasSubTabs: true,
    subTabs: [
      {
        id: 'active',
        title: 'Active Tasks',
        icon: Clock,
        tableData: [
          { id: 1, name: 'Task 1', status: 'Running', progress: '75%' },
          { id: 2, name: 'Task 2', status: 'Running', progress: '50%' },
        ],
        columns: [
          { key: 'name', label: 'Task Name', sortable: true },
          { key: 'status', label: 'Status', sortable: true },
          { key: 'progress', label: 'Progress', sortable: true },
        ],
      },
      {
        id: 'completed',
        title: 'Completed Tasks',
        icon: FileText,
        tableData: [
          { id: 3, name: 'Task 3', status: 'Completed', progress: '100%' },
          { id: 4, name: 'Task 4', status: 'Completed', progress: '100%' },
        ],
        columns: [
          { key: 'name', label: 'Task Name', sortable: true },
          { key: 'status', label: 'Status', sortable: true },
          { key: 'progress', label: 'Progress', sortable: true },
        ],
      },
    ],
  },
  {
    id: 'users',
    title: 'Users',
    icon: Users,
    tableData: [
      { id: 1, name: 'John Doe', role: 'Admin', status: 'Active' },
      { id: 2, name: 'Jane Smith', role: 'User', status: 'Active' },
    ],
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'role', label: 'Role', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    hasSubTabs: true,
    subTabs: [
      {
        id: 'general',
        title: 'General Settings',
        icon: Settings,
        tableData: [
          { id: 1, name: 'Setting 1', value: 'Enabled', type: 'Boolean' },
          { id: 2, name: 'Setting 2', value: 'Disabled', type: 'Boolean' },
        ],
        columns: [
          { key: 'name', label: 'Setting Name', sortable: true },
          { key: 'value', label: 'Value', sortable: true },
          { key: 'type', label: 'Type', sortable: true },
        ],
      },
    ],
  },
]
