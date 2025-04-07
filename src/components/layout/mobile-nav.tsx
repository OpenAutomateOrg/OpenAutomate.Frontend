"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { User } from "@/types/auth"

interface MobileNavProps {
  user: User | null
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  // Define navigation items based on authentication status
  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Icons.home className="mr-2 h-4 w-4" />,
      requiresAuth: true,
    },
    {
      title: "Automations",
      href: "/automations",
      icon: <Icons.play className="mr-2 h-4 w-4" />,
      requiresAuth: true,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <Icons.chart className="mr-2 h-4 w-4" />,
      requiresAuth: true,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Icons.cog className="mr-2 h-4 w-4" />,
      requiresAuth: true,
    }
  ]

  // Filter items based on authentication status
  const filteredNavItems = navItems.filter(item => {
    if (item.requiresAuth && !user) return false
    return true
  })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <svg
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
          >
            <path
              d="M3 5H11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M3 12H16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M3 19H21"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div className="px-7">
          <Link
            href="/"
            className="flex items-center"
            onClick={() => setOpen(false)}
          >
            <span className="font-bold">OpenAutomate</span>
          </Link>
        </div>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="pl-1 pr-7">
            <nav className="flex flex-col space-y-2">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "transparent"
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ))}
              {!user && (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground mt-4 bg-primary text-primary-foreground"
                >
                  <Icons.user className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 