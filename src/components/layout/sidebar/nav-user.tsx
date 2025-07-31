'use client'

import { ChevronsUpDown } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'

interface UserProps {
  user: {
    name: string
    email: string
  }
}
interface NavUserItem {
  title: string
  url: string
  icon?: LucideIcon
}

interface NavUserProps {
  navUser: {
    management: NavUserItem[]
    logout: NavUserItem
  }
}
export function NavUser({ user, navUser }: UserProps & NavUserProps) {
  const { isMobile } = useSidebar()
  const { logout } = useAuth()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-orange-600/10 hover:text-orange-600 hover:outline  hover:outline-orange-600 transition-all duration-200"
            >
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {navUser.management.map((management: NavUserItem) => (
                <DropdownMenuItem key={management.title}>
                  <Link key={management.title} href={management.url}>
                    <div className="flex align-center items-center gap-2">
                      {management.icon && <management.icon />}
                      {management.title}
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <Link onClick={() => logout()} href={''}>
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <div className="flex align-center items-center gap-2">
                    {navUser.logout.icon && <navUser.logout.icon />}
                    <span>{navUser.logout.title}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
