'use client'

import * as React from 'react'
import {
  Bot,
  Cog,
  LifeBuoy,
  Send,
  Settings2,
  FileKey2,
  House,
  GalleryVerticalEnd,
  AudioWaveform,
  Command,
  Users,
  ShieldAlert
} from 'lucide-react'

import { NavMain } from '@/components/layout/sidebar/nav-main'
import { NavSecondary } from '@/components/layout/sidebar/nav-secondary'
import { NavUser } from '@/components/layout/sidebar/nav-user'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import { NavOrganization } from '@/components/layout/sidebar/nav-organization'
import { useAuth } from '@/providers/auth-provider'
import { RoleBasedContent } from '@/components/auth/role-based-content'

// Common navigation items for all users
const commonNavItems = [
  {
    title: 'Home',
    url: '/dashboard',
    icon: House,
    isActive: true,
  },
  {
    title: 'Automation',
    url: '/automation',
    icon: Cog,
  },
  {
    title: 'Agent',
    url: '/agent',
    icon: Bot,
  },
  {
    title: 'Asset',
    url: '/asset',
    icon: FileKey2,
  },
]

// Admin-only navigation items
const adminNavItems = [
  {
    title: 'Administration',
    url: '/admin',
    icon: Settings2,
  },
  {
    title: 'System Users',
    url: '/admin/users',
    icon: Users,
  },
  {
    title: 'System Security',
    url: '/admin/security',
    icon: ShieldAlert,
  },
]

// Standard user navigation items (potentially different from admin)
const userNavItems = [
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings2,
  },
]

// Secondary navigation items (support, feedback, etc.)
const secondaryNavItems = [
  {
    title: 'Support',
    url: '#',
    icon: LifeBuoy,
  },
  {
    title: 'Feedback',
    url: '#',
    icon: Send,
  },
]

// Organization data (this could be fetched from an API)
const organizationData = [
  {
    name: 'Acme Inc',
    logo: GalleryVerticalEnd,
    plan: 'Enterprise',
    url: '/organizations/acme-inc',
    icon: GalleryVerticalEnd,
  },
  {
    name: 'Acme Corp.',
    logo: AudioWaveform,
    plan: 'Startup',
    url: '/organizations/acme-corp',
    icon: AudioWaveform,
  },
  {
    name: 'Evil Corp.',
    logo: Command,
    plan: 'Free',
    url: '/organizations/evil-corp',
    icon: Command,
  },
]

// User data (this would be replaced with actual user data)
const userData = {
  name: 'shadcn',
  email: 'm@example.com',
  avatar: '/avatars/shadcn.jpg',
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // No need to get user if it's not being used
  return (
    <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...props}>
      <SidebarHeader>
        <NavOrganization organizations={organizationData} />
      </SidebarHeader>
      <SidebarContent>
        {/* Main navigation with role-based items */}
        <RoleBasedContent
          adminContent={<NavMain items={[...commonNavItems, ...adminNavItems]} />}
          userContent={<NavMain items={[...commonNavItems, ...userNavItems]} />}
          fallback={<NavMain items={commonNavItems} />}
        />
        
        <NavSecondary items={secondaryNavItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
