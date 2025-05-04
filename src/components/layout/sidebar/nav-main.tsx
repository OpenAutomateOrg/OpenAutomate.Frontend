'use client'

import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              className="py-7 hover:bg-orange-600/10 hover:text-orange-600 hover:outline hover:outline-2 hover:outline-orange-600 transition-all duration-200"
              asChild
              tooltip={item.title}
            >
              <Link href={item.url}>
                <item.icon />
                <span className="text-base ">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
