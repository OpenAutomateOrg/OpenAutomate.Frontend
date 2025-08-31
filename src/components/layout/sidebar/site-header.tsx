'use client'

import { SidebarIcon, Search } from 'lucide-react'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LanguageSwitcher } from '@/components/layout/language-switcher/language-switcher'
import { Badge } from '@/components/ui/badge'

import { useSidebar } from '@/components/ui/sidebar'
import { useCommandPaletteContext } from '@/providers/command-palette-provider'

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const { openPalette } = useCommandPaletteContext()

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b ">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button className="h-8 w-8" variant="ghost" size="icon" onClick={toggleSidebar}>
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Link className="font-bold text-xl text-orange-600" href="">
          OpenAutomate
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Command Palette Search Bar */}
        <div className="w-104">
          <Button
            variant="outlineCommon"
            className="w-full justify-start text-sm text-muted-foreground h-8 px-3"
            onClick={openPalette}
          >
            <Search className="h-4 w-4 mr-2" />
            <span>Search...</span>
            <div className="ml-auto">
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
                ⌘K
              </Badge>
            </div>
          </Button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        <div className="flex items-center gap-2 ml-auto">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
