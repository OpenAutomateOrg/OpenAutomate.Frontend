'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCcw, type LucideIcon } from 'lucide-react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

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

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-2">
              <activeOrg.icon className="size-4" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeOrg.name}</span>
                {activeOrg.plan && <span className="truncate text-xs">{activeOrg.plan}</span>}
              </div>
              <Button
                variant={'ghost'}
                className="ml-auto text-xs font-semibold hover:text-orange-600 text-orange-600 transition-all duration-200"
                onClick={() => router.push('/tenant-selector')}
              >
                <RefreshCcw />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
