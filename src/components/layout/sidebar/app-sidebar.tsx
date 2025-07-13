'use client'

import * as React from 'react'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'

import { NavMain } from './nav-main'
import { NavOrganization } from './nav-organization'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'
import { RoleBasedContent } from '@/components/auth/role-based-content'
import { useAuth } from '@/hooks/use-auth'

// Import navigation configuration
import {
  createCommonNavItems,
  createUserNavItems,
  adminNavItems,
  secondaryNavItems,
  createUserManagementItems,
  createOrganizationData,
  filterNavigationByPermissions,
} from '@/lib/config/navigation'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, hasPermission, isSystemAdmin, userProfile } = useAuth()
  const params = useParams()
  const tenant = params.tenant as string

  /**
   * Helper to create tenant-aware URLs
   */
  const createTenantUrl = React.useCallback(
    (path: string) => {
      if (!tenant) return path
      return `/${tenant}${path}`
    },
    [tenant],
  )

  /**
   * Organization data
   */
  const organizationData = createOrganizationData('OpenAutomate')

  /**
   * Filtered navigation items based on user permissions
   */
  const navigationItems = useMemo(() => {
    if (!userProfile && !isSystemAdmin) {
      // If no profile loaded yet, return empty navigation to prevent flash
      return {
        common: [],
        user: [],
        admin: [],
      }
    }

    // Create base navigation items
    const commonItems = createCommonNavItems(createTenantUrl)
    const userItems = createUserNavItems(createTenantUrl)

    // Filter items based on permissions
    const filteredCommon = filterNavigationByPermissions(commonItems, hasPermission)
    const filteredUser = filterNavigationByPermissions(userItems, hasPermission)

    return {
      common: filteredCommon,
      user: filteredUser,
      admin: adminNavItems, // Admin items don't need filtering as they're only shown to system admins
    }
  }, [createTenantUrl, hasPermission, userProfile, isSystemAdmin])

  /**
   * User data for the footer
   */
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

  /**
   * User navigation items for profile management
   */
  const navUserItem = createUserManagementItems(createTenantUrl)

  /**
   * Show loading state while navigation is being determined
   */
  if (!userProfile && !isSystemAdmin) {
    return (
      <Sidebar
        className=" top-(--header-height) h-[calc(100svh-var(--header-height))]! dark:bg-black/60"
        {...props}
      >
        <SidebarHeader>
          <NavOrganization organizations={organizationData} />
        </SidebarHeader>
        <SidebarContent>
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-muted-foreground">Loading navigation...</div>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={userData} navUser={navUserItem} />
        </SidebarFooter>
      </Sidebar>
    )
  }

  return (
    <Sidebar
      className=" top-(--header-height) h-[calc(100svh-var(--header-height))]! dark:bg-black/60"
      {...props}
    >
      <SidebarHeader>
        <NavOrganization organizations={organizationData} />
      </SidebarHeader>
      <SidebarContent>
        {/* Main navigation with role-based items and permission filtering */}
        <RoleBasedContent
          adminContent={<NavMain items={[...navigationItems.common, ...navigationItems.admin]} />}
          userContent={<NavMain items={[...navigationItems.common, ...navigationItems.user]} />}
          fallback={<NavMain items={navigationItems.common} />}
        />

        <NavSecondary items={secondaryNavItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} navUser={navUserItem} />
      </SidebarFooter>
    </Sidebar>
  )
}
