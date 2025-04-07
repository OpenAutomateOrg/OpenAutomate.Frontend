"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

interface SidebarNavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname()
  
  // Define sidebar navigation items
  const sidebarNavItems: SidebarNavItem[] = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: <Icons.home className="mr-2 h-4 w-4" />,
    },
    {
      title: "Automations",
      href: "/automations",
      icon: <Icons.play className="mr-2 h-4 w-4" />,
    },
    {
      title: "Workflows",
      href: "/workflows",
      icon: <Icons.fileText className="mr-2 h-4 w-4" />,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <Icons.chart className="mr-2 h-4 w-4" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Icons.settings className="mr-2 h-4 w-4" />,
    },
  ]

  return (
    <div className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Dashboard
          </h2>
          <div className="space-y-1">
            {sidebarNavItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  {item.icon}
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 