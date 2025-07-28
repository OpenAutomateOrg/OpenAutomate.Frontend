'use client'

import { ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function NavMain({
  items,
}: {
  items:
    | {
        title: string
        url?: string
        icon: LucideIcon
        isActive?: boolean
        items?: {
          title: string
          url: string
        }[]
      }[]
    | undefined
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items?.map((item) =>
          item.url ? (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className="py-7 hover:bg-orange-600/10 hover:text-orange-600 hover:outline  hover:outline-orange-600 transition-all duration-200"
                tooltip={item.title}
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className="py-7 hover:bg-orange-600/10 hover:text-orange-600 hover:outline hover:outline-orange-600 transition-all duration-200"
                    tooltip={item.title}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.items && item.items.length > 0 && (
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isActive = pathname === subItem.url
                      return (
                        <SidebarMenuSubItem
                          key={subItem.title}
                          className={cn(
                            'transition-all duration-200',
                            isActive &&
                              'hover:outline hover:outline-orange-600 text-orange-600 bg-orange-600/10',
                          )}
                        >
                          <SidebarMenuSubButton
                            asChild
                            className={cn(
                              'py-5 transition-all duration-200 hover:bg-orange-600/10 hover:text-orange-600',
                              isActive &&
                                'outline  outline-orange-600 text-orange-600 bg-orange-600/10',
                            )}
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
