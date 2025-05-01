import { Tickets, Building2, SquareStack, Users } from 'lucide-react'
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
  icon: SquareStack,
  hasSubTabs: false,
}

const organizationUnitTab: Tab = {
  id: 'organization-unit',
  title: 'Oranization Unit',
  icon: Building2,
  hasSubTabs: false,
}

const licenseTab: Tab = {
  id: 'license',
  title: 'License',
  icon: Tickets,
  hasSubTabs: true,
}

// Export all tabs data
export const AdminitrationTab: Tab[] = [usersTab, rolesTab, organizationUnitTab, licenseTab]
