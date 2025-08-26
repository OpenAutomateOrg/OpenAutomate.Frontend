'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { RefreshCcw, type LucideIcon } from 'lucide-react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { organizationUnitApi } from '@/lib/api/organization-units'

interface OrganizationItem {
  name: string
  plan?: string
  url: string
  icon: LucideIcon
  isActive?: boolean
}

interface OrganizationUnit {
  id: string
  name: string
  description: string
}

interface NavOrganizationProps {
  organizations: OrganizationItem[]
}

export function NavOrganization({ organizations }: Readonly<NavOrganizationProps>) {
  const router = useRouter()
  const params = useParams()
  const slug = params.tenant as string | undefined

  // State for organization unit
  const [organizationUnit, setOrganizationUnit] = React.useState<OrganizationUnit | null>(null)

  // Fetch organization unit by slug
  React.useEffect(() => {
    if (!slug) {
      setOrganizationUnit(null)
      return
    }

    organizationUnitApi
      .getBySlug(slug)
      .then((ou) => {
        return organizationUnitApi.getById(ou.id)
      })
      .then((ou) => {
        setOrganizationUnit(ou)
      })
      .catch(() => {
        setOrganizationUnit(null)
      })
  }, [slug])

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
                <span className="truncate font-semibold text-base">{organizationUnit?.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {organizationUnit?.description}
                </span>
              </div>
              <Button
                size="icon"
                className="ml-auto  transition-colors"
                aria-label="Switch organization"
                onClick={() => router.push('/tenant-selector')}
              >
                <RefreshCcw className="size-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
