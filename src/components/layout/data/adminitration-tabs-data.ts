import { BarChart3, Package, ShoppingCart, Users } from 'lucide-react'
import type { Tab } from '@/types/tabs'

const usersTab: Tab = {
  id: 'users',
  title: 'Users',
  icon: Users,
  hasSubTabs: false,
}

const rolesTab: Tab = {
  id: 'roles',
  title: 'Roles',
  icon: ShoppingCart,
  hasSubTabs: false,
}

const organizationUnitTab: Tab = {
  id: 'organization-unit',
  title: 'Oranization Unit',
  icon: Package,
  hasSubTabs: false,
}

const licenseTab: Tab = {
  id: 'license',
  title: 'License',
  icon: BarChart3,
  hasSubTabs: true,
}

// Export all tabs data
export const AdminitrationTab: Tab[] = [usersTab, rolesTab, organizationUnitTab, licenseTab]
