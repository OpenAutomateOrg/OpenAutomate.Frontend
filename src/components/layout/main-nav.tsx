'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User } from '@/types/auth'

interface MainNavProps {
  user: User | null
}

export function MainNav({ user }: MainNavProps) {
  const pathname = usePathname()
  const isAuthenticated = !!user

  // Define base navigation items
  const baseNavItems = [
    {
      title: 'About Us',
      href: '/about',
    },
    {
      title: 'Guides',
      href: '/guide',
    },
    {
      title: 'Contact Us',
      href: '/contact',
    },
  ]

  // Add user-specific nav items when authenticated
  const navItems = isAuthenticated
    ? [
        ...baseNavItems,
        {
          title: 'Dashboard',
          href: '/dashboard',
        },
      ]
    : baseNavItems

  return (
    <div className="mr-4 hidden md:flex">
      <nav className="flex items-center space-x-6 text-sm font-medium">
        {navItems.map(({ title, href }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative px-2 py-1.5 transition-all duration-200 hover:text-orange-600',
              pathname === href
                ? 'text-orange-600 font-semibold after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-orange-600 after:rounded-full'
                : 'text-foreground/60 hover:text-orange-600',
            )}
          >
            {title}
          </Link>
        ))}
      </nav>
    </div>
  )
}
