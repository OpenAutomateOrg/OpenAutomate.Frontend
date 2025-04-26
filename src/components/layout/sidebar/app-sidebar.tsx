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
} from 'lucide-react'

import { NavMain } from '@/components/layout/sidebar/nav-main'
import { NavSecondary } from '@/components/layout/sidebar/nav-secondary'
import { NavUser } from '@/components/layout/sidebar/nav-user'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import { NavOrganization } from '@/components/layout/sidebar/nav-organization'

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  organizations: [
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
  ],
  navMain: [
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
    {
      title: 'Adminitration',
      url: '/adminitration',
      icon: Settings2,
    },
  ],
  navSecondary: [
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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...props}>
      <SidebarHeader>
        <NavOrganization organizations={data.organizations} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
