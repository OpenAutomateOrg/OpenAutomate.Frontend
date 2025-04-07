"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { User } from "@/types/auth"

interface MainNavProps {
  user: User | null
}

export function MainNav({ user }: MainNavProps) {
  const pathname = usePathname()
  
  // Define navigation items based on authentication status
  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      requiresAuth: true,
    },
    {
      title: "Automations",
      href: "/automations",
      requiresAuth: true,
    },
    {
      title: "Reports",
      href: "/reports",
      requiresAuth: true,
    },
    {
      title: "Settings",
      href: "/settings",
      requiresAuth: true,
    }
  ]

  // Filter items based on authentication status
  const filteredNavItems = navItems.filter(item => {
    if (item.requiresAuth && !user) return false
    return true
  })

  return (
    <div className="mr-4 hidden md:flex">
      <nav className="flex items-center space-x-6 text-sm font-medium">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === item.href
                ? "text-foreground font-semibold"
                : "text-foreground/60"
            )}
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  )
} 