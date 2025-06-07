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
  Building2,
  Command,
  Users,
  ShieldAlert,
} from 'lucide-react'

import { NavMain } from '@/components/layout/sidebar/nav-main'
import { NavSecondary } from '@/components/layout/sidebar/nav-secondary'
import { NavUser } from '@/components/layout/sidebar/nav-user'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import { NavOrganization } from '@/components/layout/sidebar/nav-organization'
import { RoleBasedContent } from '@/components/auth/role-based-content'
import { useParams } from 'next/navigation'
import { useOrganizationUnits } from '@/hooks/use-organization-units'
import { useAuth } from '@/hooks/use-auth'

// Map to associate organization name with an icon
const organizationIcons: Record<string, typeof Building2> = {
  default: Building2,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams()
  const tenantSlug = params?.tenant as string
  const { organizationUnits } = useOrganizationUnits()
  const { user } = useAuth()

  // Transform organization units to the format expected by NavOrganization
  const organizationData = React.useMemo(() => {
    return organizationUnits.map((org) => ({
      name: org.name,
      // Use org description or slug as additional info
      plan: org.description || org.slug,
      url: `/${org.slug}/dashboard`,
      icon: organizationIcons[org.slug] || organizationIcons.default,
      // Mark the current tenant
      isActive: org.slug === tenantSlug,
    }))
  }, [organizationUnits, tenantSlug])

  // Function to create tenant-specific URLs
  const createTenantUrl = (path: string) => {
    if (!tenantSlug) return path
    return `/${tenantSlug}${path}`
  }

  // Common navigation items for all users with tenant context
  const commonNavItems = [
    {
      title: 'Home',
      url: createTenantUrl('/dashboard'),
      icon: House,
      isActive: true,
    },
    {
      title: 'Automation',
      icon: Cog,
      items: [
        {
          title: 'Executions',
          url: createTenantUrl('/automation/executions'),
        },
        {
          title: 'Schedule',
          url: createTenantUrl('/automation/schedule'),
        },
        {
          title: 'Triggers',
          url: createTenantUrl('/automation/triggers'),
        },
        {
          title: 'Package',
          url: createTenantUrl('/automation/package'),
        },
        {
          title: 'Logs',
          url: createTenantUrl('/automation/logs'),
        },
      ],
    },
    {
      title: 'Agent',
      url: createTenantUrl('/agent'),
      icon: Bot,
      items: [
        {
          title: 'Agent',
          url: createTenantUrl('/agent'),
        },
        {
          title: 'Agent Groups',
          url: createTenantUrl('/agent/groups'),
        },
      ],
    },
    {
      title: 'Asset',
      url: createTenantUrl('/asset'),
      icon: FileKey2,
    },
    {
      title: 'Administration',
      icon: Settings2,
      items: [
        {
          title: 'Users',
          url: createTenantUrl('/administration/users'),
        },
        {
          title: 'Roles',
          url: createTenantUrl('/administration/roles'),
        },
        {
          title: 'Organization Unit',
          url: createTenantUrl('/administration/organizationUnit'),
        },
        {
          title: 'Licenses',
          url: createTenantUrl('/administration/licenses'),
        },
      ],
    },
  ]

  // Admin-only navigation items (system-level, not tenant-specific)
  const adminNavItems = [
    {
      title: 'Administration',
      url: '/administration/users',
      icon: Settings2,
      items: [
        {
          title: 'Users',
          url: '/administration/users',
        },
        {
          title: 'Roles',
          url: '/administration/roles',
        },
        {
          title: 'Organizations',
          url: '/administration/Organizations',
        },
        {
          title: 'Licenses',
          url: '/administration/licenses',
        },
      ],
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

  // Standard user navigation items with tenant context
  const userNavItems = [
    {
      title: 'Settings',
      url: createTenantUrl('/settings'),
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
    {
      title: 'Switch Organization',
      url: '/tenant-selector',
      icon: Command,
    },
  ]

  // User data from auth context
  const userData = user
    ? {
        name: `${user.firstName} ${user.lastName}`.trim() || user.email,
        email: user.email,
        avatar: '/avatars/placeholder.png', // Default avatar image
      }
    : {
        name: 'User',
        email: 'Loading...',
        avatar: '/avatars/placeholder.png',
      }

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
