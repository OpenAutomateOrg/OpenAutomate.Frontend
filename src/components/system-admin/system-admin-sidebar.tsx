'use client'

import * as React from 'react'
import { Users, Building2, Bot, LayoutDashboard, Settings, Shield } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/system-admin',
    icon: LayoutDashboard,
  },
  {
    title: 'User Management',
    url: '/system-admin/user-management',
    icon: Users,
  },
  {
    title: 'Organization Units',
    url: '/system-admin/org-unit-management',
    icon: Building2,
  },
  {
    title: 'Agent Management',
    url: '/system-admin/agent-management',
    icon: Bot,
  },
  {
    title: 'System Settings',
    url: '/system-admin/settings',
    icon: Settings,
  },
]

export function SystemAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...props}>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-sidebar-foreground">System Admin</span>
            <span className="truncate text-xs text-sidebar-foreground/60">Platform Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 py-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.url

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link
                    href={item.url}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:-accent hover:text-sidebar-accent-foreground transition-colors text-sidebar-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
