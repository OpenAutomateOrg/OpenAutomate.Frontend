'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/utils'
import { Icons } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { User } from '@/types/auth'

interface MobileNavProps {
  user: User | null
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  const navItems = [
    {
      title: 'About Us',
      href: '/about',
      icon: <Icons.about className="mr-2 h-4 w-4" />,
      requiresAuth: true,
    },
    {
      title: 'Guides',
      href: '/guide',
      icon: <Icons.guide className="mr-2 h-4 w-4" />,
      requiresAuth: true,
    },
    {
      title: 'Contact Us',
      href: '/contact',
      icon: <Icons.contact className="mr-2 h-4 w-4" />,
      requiresAuth: true,
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-orange-600/10 hover:text-orange-600 focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
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
            />
            <path
              d="M3 12H16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 19H21"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div className="px-7">
          <Link
            href="/"
            className="flex items-center text-lg font-bold hover:text-orange-600 transition-colors"
            onClick={() => setOpen(false)}
          >
            OpenAutomate
          </Link>
        </div>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="pl-1 pr-7">
            <nav className="flex flex-col space-y-2">
              {navItems.map(({ title, href, icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                    pathname === href
                      ? 'bg-orange-600/10 text-orange-600'
                      : 'hover:bg-orange-600/10 hover:text-orange-600',
                  )}
                >
                  {icon}
                  {title}
                </Link>
              ))}
              {!user && (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-md px-3 py-2 text-sm font-medium mt-4 bg-orange-600 text-white hover:bg-orange-700 transition-colors"
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
