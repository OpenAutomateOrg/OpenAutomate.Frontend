'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { 
  Search,
  Home,
  Settings,
  Users,
  Bot,
  Calendar,
  BarChart3,
  Plus,
  FileText,
  Zap,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'

interface CommandItem {
  id: string
  title: string
  description?: string
  icon: React.ReactNode
  action: () => void
  category: string
  keywords?: string[]
  shortcut?: string
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const params = useParams()
  const { setTheme, theme } = useTheme()
  const tenant = params.tenant as string

  const createTenantUrl = (path: string) => {
    return tenant ? `/${tenant}${path}` : path
  }

  // Command items configuration
  const commandItems: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      description: 'Go to main dashboard',
      icon: <Home className="h-4 w-4" />,
      action: () => router.push(createTenantUrl('/dashboard')),
      category: 'Navigation',
      keywords: ['home', 'main', 'overview'],
    },
    {
      id: 'nav-automations',
      title: 'Automations',
      description: 'View automation executions',
      icon: <Zap className="h-4 w-4" />,
      action: () => router.push(createTenantUrl('/automation/executions')),
      category: 'Navigation',
      keywords: ['automation', 'executions', 'workflows'],
    },
    {
      id: 'nav-agents',
      title: 'Agents',
      description: 'Manage automation agents',
      icon: <Bot className="h-4 w-4" />,
      action: () => router.push(createTenantUrl('/agent')),
      category: 'Navigation',
      keywords: ['agents', 'bots', 'workers'],
    },
    {
      id: 'nav-schedule',
      title: 'Schedule',
      description: 'View scheduled tasks',
      icon: <Calendar className="h-4 w-4" />,
      action: () => router.push(createTenantUrl('/automation/schedule')),
      category: 'Navigation',
      keywords: ['schedule', 'tasks', 'cron'],
    },
    {
      id: 'nav-users',
      title: 'Users',
      description: 'Manage users and permissions',
      icon: <Users className="h-4 w-4" />,
      action: () => router.push(createTenantUrl('/administration/users')),
      category: 'Navigation',
      keywords: ['users', 'team', 'permissions'],
    },

    // Quick Actions
    {
      id: 'action-new-automation',
      title: 'Create New Automation',
      description: 'Start building a new automation workflow',
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        console.log('Create new automation')
        onOpenChange(false)
      },
      category: 'Quick Actions',
      keywords: ['create', 'new', 'automation', 'workflow'],
      shortcut: 'Ctrl+N',
    },
    {
      id: 'action-reports',
      title: 'View Reports',
      description: 'Open analytics and reports',
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => {
        console.log('Open reports')
        onOpenChange(false)
      },
      category: 'Quick Actions',
      keywords: ['reports', 'analytics', 'metrics'],
    },
    {
      id: 'action-documentation',
      title: 'Documentation',
      description: 'View help and documentation',
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        window.open('https://docs.openautomate.com', '_blank')
        onOpenChange(false)
      },
      category: 'Quick Actions',
      keywords: ['help', 'docs', 'documentation', 'guide'],
    },

    // Settings
    {
      id: 'settings-theme-light',
      title: 'Switch to Light Theme',
      description: 'Change to light mode',
      icon: <Sun className="h-4 w-4" />,
      action: () => {
        setTheme('light')
        onOpenChange(false)
      },
      category: 'Settings',
      keywords: ['theme', 'light', 'appearance'],
    },
    {
      id: 'settings-theme-dark',
      title: 'Switch to Dark Theme',
      description: 'Change to dark mode',
      icon: <Moon className="h-4 w-4" />,
      action: () => {
        setTheme('dark')
        onOpenChange(false)
      },
      category: 'Settings',
      keywords: ['theme', 'dark', 'appearance'],
    },
    {
      id: 'settings-general',
      title: 'Settings',
      description: 'Open application settings',
      icon: <Settings className="h-4 w-4" />,
      action: () => router.push(createTenantUrl('/settings')),
      category: 'Settings',
      keywords: ['settings', 'preferences', 'configuration'],
    },

    // System
    {
      id: 'system-help',
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: <HelpCircle className="h-4 w-4" />,
      action: () => {
        console.log('Open help')
        onOpenChange(false)
      },
      category: 'System',
      keywords: ['help', 'support', 'contact'],
    },
    {
      id: 'system-logout',
      title: 'Sign Out',
      description: 'Sign out of your account',
      icon: <LogOut className="h-4 w-4" />,
      action: () => {
        console.log('Sign out')
        onOpenChange(false)
      },
      category: 'System',
      keywords: ['logout', 'sign out', 'exit'],
    },
  ]

  // Filter items based on current theme
  const filteredItems = commandItems.filter(item => {
    if (item.id === 'settings-theme-light' && theme === 'light') return false
    if (item.id === 'settings-theme-dark' && theme === 'dark') return false
    return true
  })

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, CommandItem[]>)

  const runCommand = React.useCallback((command: () => void) => {
    onOpenChange(false)
    command()
  }, [onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Type a command or search..." 
        className="border-0 focus:ring-0"
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Search className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No results found.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try searching for navigation, actions, or settings.
            </p>
          </div>
        </CommandEmpty>

        {Object.entries(groupedItems).map(([category, items], index) => (
          <React.Fragment key={category}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={category}>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.description} ${item.keywords?.join(' ')}`}
                  onSelect={() => runCommand(item.action)}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.title}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.shortcut && (
                    <Badge variant="secondary" className="text-xs">
                      {item.shortcut}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
