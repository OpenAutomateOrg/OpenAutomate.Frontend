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
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus'
import { useAuth } from '@/hooks/use-auth'

// Import navigation configuration
import {
  createUserNavItems,
  createTranslatedUserNavItems,
  adminNavItems,
  secondaryNavItems,
  createUserManagementItems,
  createOrganizationData,
  filterNavigationByPermissions,
} from '@/lib/config/navigation'
import { useLocale } from '@/providers/locale-provider'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useLocale()
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
        user: [],
        admin: [],
      }
    }

    if (isSystemAdmin) {
      // System admin gets admin navigation items
      return {
        admin: adminNavItems,
      }
    }

    // Regular users get filtered navigation based on permissions
    // Use translated items if translation function is available, otherwise fallback to original
    const userItems = t
      ? createTranslatedUserNavItems(createTenantUrl, t)
      : createUserNavItems(createTenantUrl)

    // Debug logging
    console.log('Navigation Debug:', {
      userItemsCount: userItems.length,
      userItems: userItems.map((item) => ({
        title: item.title,
        url: item.url,
        hasPermission: item.permission
          ? hasPermission(item.permission.resource, item.permission.level)
          : true,
      })),
      t: !!t,
      hasPermission: !!hasPermission,
    })

    // Filter items based on permissions
    const filteredUser = filterNavigationByPermissions(userItems, hasPermission)

    // Debug filtered results
    console.log('Filtered navigation:', {
      originalCount: userItems.length,
      filteredCount: filteredUser.length,
      filtered: filteredUser.map((item) => ({ title: item.title, url: item.url })),
    })

    return {
      user: filteredUser.length > 0 ? filteredUser : userItems, // Fallback to unfiltered if empty
      admin: [], // Regular users don't get admin items
    }
  }, [createTenantUrl, hasPermission, userProfile, isSystemAdmin, t])

  /**
   * User data for the footer
   */
  const userData = user
    ? {
        name: `${user.firstName} ${user.lastName}`.trim() || user.email,
        email: user.email,
      }
    : {
        name: 'User',
        email: 'Loading...',
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
      {!isSystemAdmin && (
        <SidebarHeader className="px-0 py-2">
          <NavOrganization organizations={organizationData} />
        </SidebarHeader>
      )}
      <SidebarContent>
        {/* Main navigation with role-based items and permission filtering */}
        <RoleBasedContent
          adminContent={<NavMain items={navigationItems.admin} />}
          userContent={<NavMain items={navigationItems.user} />}
          fallback={<NavMain items={navigationItems.user} />}
        />

        {/* Subscription status - only show for regular users with tenant context */}
        {!isSystemAdmin && tenant && (
          <div className="px-3 py-2">
            <SubscriptionStatus />
          </div>
        )}

        <NavSecondary items={secondaryNavItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} navUser={navUserItem} />
      </SidebarFooter>
    </Sidebar>
  )
}
