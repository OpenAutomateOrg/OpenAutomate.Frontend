'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'
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
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface OrganizationItem {
  name: string
  plan?: string
  url: string
  icon: LucideIcon
  isActive?: boolean
}

interface NavOrganizationProps {
  organizations: OrganizationItem[]
}

export function NavOrganization({ organizations }: NavOrganizationProps) {
  const router = useRouter()

  // Find active organization
  const activeOrg = React.useMemo(() => {
    return organizations.find((org) => org.isActive) || organizations[0]
  }, [organizations])

  // Handle organization selection
  const handleSelectOrg = (url: string) => {
    router.push(url)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Organization</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-orange-600/10 hover:text-orange-600 hover:outline hover:outline-2 hover:outline-orange-600 transition-all duration-200"
                >
                  {activeOrg ? (
                    <>
                      <activeOrg.icon className="size-4" />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{activeOrg.name}</span>
                        {activeOrg.plan && (
                          <span className="truncate text-xs">{activeOrg.plan}</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">Select Organization</span>
                    </div>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                sideOffset={4}
              >
                {activeOrg && (
                  <>
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <activeOrg.icon className="size-4" />
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-medium">{activeOrg.name}</span>
                          {activeOrg.plan && (
                            <span className="truncate text-xs">{activeOrg.plan}</span>
                          )}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuGroup>
                  {organizations.map((org) => (
                    <DropdownMenuItem
                      key={org.name}
                      onClick={() => handleSelectOrg(org.url)}
                      className={cn(
                        'flex items-center gap-2',
                        org.isActive ? 'bg-muted' : undefined,
                      )}
                    >
                      <org.icon className="size-4" />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{org.name}</span>
                        {org.plan && <span className="truncate text-xs">{org.plan}</span>}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push('/tenant-selector')}
                    className="flex items-center gap-2"
                  >
                    <span className="flex h-4 w-4 items-center justify-center">+</span>
                    <span>Create/Switch Organization</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
