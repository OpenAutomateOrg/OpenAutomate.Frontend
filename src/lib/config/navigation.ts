import {
  type LucideIcon,
  House,
  Cog,
  Bot,
  FileKey2,
  Settings2,
  Users,
  LifeBuoy,
  Sparkles,
  Building2,
  LayoutDashboard,
} from 'lucide-react'
import { Resources, Permissions } from '@/lib/constants/resources'

// Translation keys for navigation items
export const NAVIGATION_KEYS = {
  home: 'navigation.home',
  automation: 'navigation.automation',
  executions: 'navigation.executions',
  schedule: 'navigation.schedule',
  package: 'navigation.package',
  agent: 'navigation.agent',
  asset: 'navigation.asset',
  administration: 'navigation.administration',
  users: 'navigation.users',
  roles: 'navigation.roles',
  organizationUnits: 'navigation.organizationUnits',
  subscription: 'navigation.subscription',
  help: 'navigation.help',
  support: 'navigation.support',
  settings: 'navigation.settings',
} as const

/**
 * Interface for navigation items with permission requirements
 * Compatible with NavMain component interface
 */
export interface NavigationItem {
  title: string
  url?: string
  icon: LucideIcon
  isActive?: boolean
  /** Required permission to view this item */
  permission?: {
    resource: string
    level: number
  }
  /** Child navigation items */
  items?: {
    title: string
    url: string
    permission?: {
      resource: string
      level: number
    }
  }[]
}

/**
 * Interface for organization data
 */
export interface OrganizationItem {
  name: string
  plan?: string
  url: string
  icon: LucideIcon
  isActive?: boolean
}

/**
 * Interface for user navigation items
 */
export interface UserNavigationItem {
  title: string
  url: string
  icon: LucideIcon
}

/**
 * Common navigation items for all users with tenant context
 * Each item specifies the minimum permission required to view it
 */
export const createUserNavItems = (createTenantUrl: (path: string) => string): NavigationItem[] => [
  {
    title: 'Home',
    url: createTenantUrl('/dashboard'),
    icon: House,
    isActive: true,
    // Dashboard requires no specific permission - available to all authenticated users
  },
  {
    title: 'Automation',
    icon: Cog,
    items: [
      {
        title: 'Executions',
        url: createTenantUrl('/automation/executions'),
        permission: {
          resource: Resources.EXECUTION,
          level: Permissions.VIEW,
        },
      },
      {
        title: 'Schedule',
        url: createTenantUrl('/automation/schedule'),
        permission: {
          resource: Resources.SCHEDULE,
          level: Permissions.VIEW,
        },
      },
      {
        title: 'Package',
        url: createTenantUrl('/automation/package'),
        permission: {
          resource: Resources.PACKAGE,
          level: Permissions.VIEW,
        },
      },
    ],
  },
  {
    title: 'Agent',
    url: createTenantUrl('/agent'),
    icon: Bot,
    permission: {
      resource: Resources.AGENT,
      level: Permissions.VIEW,
    },
    items: [
      {
        title: 'Agent',
        url: createTenantUrl('/agent'),
        permission: {
          resource: Resources.AGENT,
          level: Permissions.VIEW,
        },
      },
    ],
  },
  {
    title: 'Asset',
    url: createTenantUrl('/asset'),
    icon: FileKey2,
    permission: {
      resource: Resources.ASSET,
      level: Permissions.VIEW,
    },
  },
  {
    title: 'Administration',
    icon: Settings2,
    permission: {
      resource: Resources.ORGANIZATION_UNIT,
      level: Permissions.VIEW,
    },
    items: [
      {
        title: 'Users',
        url: createTenantUrl('/administration/users'),
        permission: {
          resource: Resources.USER,
          level: Permissions.VIEW,
        },
      },
      {
        title: 'Roles',
        url: createTenantUrl('/administration/roles'),
        permission: {
          resource: Resources.ORGANIZATION_UNIT,
          level: Permissions.VIEW,
        },
      },
      {
        title: 'Organization Unit',
        url: createTenantUrl('/administration/organizationUnit'),
        permission: {
          resource: Resources.ORGANIZATION_UNIT,
          level: Permissions.UPDATE,
        },
      },
      {
        title: 'Subscription',
        url: createTenantUrl('/administration/subscription'),
        permission: {
          resource: Resources.ORGANIZATION_UNIT,
          level: Permissions.VIEW,
        },
      },
    ],
  },
]

/**
 * Admin-only navigation items (system-level, not tenant-specific)
 */
export const adminNavItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'User Management',
    url: '/user-management',
    icon: Users,
  },
  {
    title: 'Organization Units',
    url: '/org-unit-management',
    icon: Building2,
  },
]

/**
 * Secondary navigation items (support, feedback, etc.)
 */
export const secondaryNavItems: { title: string; url: string; icon: LucideIcon }[] = [
  {
    title: 'Support',
    url: '#',
    icon: LifeBuoy,
  },
]

/**
 * User management navigation items for regular users
 */
export const createUserManagementItems = (createTenantUrl: (path: string) => string) => ({
  management: [
    {
      title: 'Profile',
      url: createTenantUrl('/profile'),
      icon: Sparkles,
    },
    {
      title: 'Notifications',
      url: '',
      icon: Sparkles,
    },
  ],
  logout: {
    title: 'Log out',
    url: '',
  },
})

/**
 * System admin user management navigation items
 */
export const createSystemAdminUserManagementItems = () => ({
  management: [
    {
      title: 'Profile',
      url: '/settings/profile',
      icon: Sparkles,
    },
  ],
  logout: {
    title: 'Log out',
    url: '',
  },
})

/**
 * Create organization data structure
 */
export const createOrganizationData = (orgName?: string): OrganizationItem[] => [
  {
    name: orgName || 'OpenAutomate',
    plan: 'Enterprise',
    url: '/',
    icon: Building2,
    isActive: true,
  },
]

/**
 * Helper function to filter navigation items based on user permissions
 */
export const filterNavigationByPermissions = (
  items: NavigationItem[],
  hasPermission: (resource: string, level: number) => boolean,
): NavigationItem[] => {
  return items.reduce<NavigationItem[]>((filteredItems, item) => {
    // Check if user has permission to view this item
    if (item.permission && !hasPermission(item.permission.resource, item.permission.level)) {
      return filteredItems
    }

    // If item has children, filter them recursively
    const filteredItem = { ...item }
    if (item.items) {
      const filteredChildren = item.items.filter((child) => {
        return !child.permission || hasPermission(child.permission.resource, child.permission.level)
      })

      // Only include parent if it has accessible children or if it has its own URL
      if (filteredChildren.length > 0 || item.url) {
        filteredItem.items = filteredChildren
      } else {
        // Parent has no accessible children and no direct URL, exclude it
        return filteredItems
      }
    }

    filteredItems.push(filteredItem)
    return filteredItems
  }, [])
}
